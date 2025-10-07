
import React, { useState, useEffect, useCallback } from 'react';
import { Order, Retailer, DispatchConfig } from "@/components/utils/mockApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { isWithinBusinessHours, hasInsufficientRetailerCoverage, notifyCustomerOrderQueued } from '../utils/deliveryChargeCalculator';

/**
 * Background monitor for:
 * 1. Queued orders - auto-retries sending when conditions improve
 * 2. Pending orders with insufficient coverage - queues them if no one accepts after timeout
 */
export default function QueuedOrdersMonitor() {
  const [queuedOrders, setQueuedOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [config, setConfig] = useState(null);
  const [retailers, setRetailers] = useState([]);
  const [lastCheck, setLastCheck] = useState(new Date());

  const loadData = useCallback(async () => {
    const [queuedOrdersList, pendingOrdersList, configs, retailersList] = await Promise.all([
      Order.filter({ is_queued: true, status: 'queued' }),
      Order.filter({ status: 'pending_acceptance', insufficient_retailer_coverage: true }),
      DispatchConfig.list(),
      Retailer.list()
    ]);
    
    setQueuedOrders(queuedOrdersList);
    setPendingOrders(pendingOrdersList);
    if (configs.length > 0) setConfig(configs[0]);
    setRetailers(retailersList);
  }, []);

  const processOrders = useCallback(async () => {
    await loadData();
    setLastCheck(new Date());
    
    const currentConfig = await DispatchConfig.list();
    const currentRetailers = await Retailer.list();
    const activeConfig = currentConfig.length > 0 ? currentConfig[0] : null;
    
    if (!activeConfig) return;

    const now = new Date();
    const withinBusinessHours = isWithinBusinessHours(activeConfig);
    const onlineRetailers = currentRetailers.filter(r => r.availability_status === 'online').length;
    const totalRetailers = currentRetailers.filter(r => r.status === 'active').length;
    const hasEnoughRetailers = !hasInsufficientRetailerCoverage(onlineRetailers, totalRetailers, activeConfig);

    // Process queued orders
    const currentQueuedOrders = await Order.filter({ is_queued: true, status: 'queued' });
    for (const order of currentQueuedOrders) {
      const retryInterval = (activeConfig.queue_retry_interval_minutes || 15) * 60 * 1000;
      const timeSinceLastRetry = order.last_queue_retry_at ? 
        now - new Date(order.last_queue_retry_at) : 
        now - new Date(order.queued_at);

      const shouldRetry = timeSinceLastRetry >= retryInterval;

      if (withinBusinessHours && hasEnoughRetailers) {
        // Release order from queue - send to retailers
        await Order.update(order.id, {
          status: 'pending_acceptance',
          is_queued: false,
          queue_retry_count: (order.queue_retry_count || 0) + 1,
          last_queue_retry_at: new Date().toISOString(),
          pending_acceptance_since: new Date().toISOString()
        });
        
        console.log(`✅ Released order ${order.id} from queue - sending to retailers`);
      } else if (shouldRetry) {
        // Keep in queue but increment retry count
        await Order.update(order.id, {
          queue_retry_count: (order.queue_retry_count || 0) + 1,
          last_queue_retry_at: new Date().toISOString()
        });
        
        // Re-notify customer every 3 retries
        if ((order.queue_retry_count || 0) % 3 === 0) {
          await notifyCustomerOrderQueued(order);
        }
        
        console.log(`🔄 Keeping order ${order.id} in queue (attempt ${order.queue_retry_count + 1})`);
      }
    }

    // Process pending orders with insufficient coverage that haven't been accepted
    const currentPendingOrders = await Order.filter({ 
      status: 'pending_acceptance', 
      insufficient_retailer_coverage: true 
    });
    
    const timeoutMinutes = activeConfig.queue_retry_interval_minutes || 15;
    
    for (const order of currentPendingOrders) {
      if (!order.pending_acceptance_since) continue;
      
      const timePending = now - new Date(order.pending_acceptance_since);
      const timeoutMs = timeoutMinutes * 60 * 1000;
      
      // If no one accepted after timeout, queue it
      if (timePending >= timeoutMs) {
        await Order.update(order.id, {
          status: 'queued',
          is_queued: true,
          queued_at: new Date().toISOString(),
          queue_retry_count: 0
        });
        
        // Notify customer
        await notifyCustomerOrderQueued(order);
        
        console.log(`📦 Order ${order.id} queued after ${timeoutMinutes} min with no acceptance (insufficient coverage)`);
      }
    }

    // Reload after processing
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    
    // Check every minute
    const interval = setInterval(() => {
      processOrders();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData, processOrders]);

  const totalIssues = queuedOrders.length + pendingOrders.length;

  if (totalIssues === 0) {
    return null;
  }

  const withinBusinessHours = isWithinBusinessHours(config);
  const onlineRetailers = retailers.filter(r => r.availability_status === 'online').length;
  const totalRetailers = retailers.filter(r => r.status === 'active').length;

  return (
    <Card className="border-2 border-[#F4B321] shadow-lg mb-6 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#F4B321] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#F4B321] animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                <span>{queuedOrders.length} Order{queuedOrders.length !== 1 ? 's' : ''} Queued</span>
                {pendingOrders.length > 0 && (
                  <>
                    <span className="text-[#F4B321]"> • </span>
                    <span className="text-orange-700">{pendingOrders.length} Pending (Low Coverage)</span>
                  </>
                )}
                <Badge variant="outline" className="bg-[#F4B321] bg-opacity-10 text-[#F4B321] border-[#F4B321]">
                  Auto-Monitoring
                </Badge>
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {queuedOrders.length > 0 && (
                  <p className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#F4B321]" />
                    <span>
                      {!withinBusinessHours ? 
                        `Outside business hours (${config?.business_hours_start || '08:00'} - ${config?.business_hours_end || '22:00'}) - will send when shops open` : 
                        `Only ${onlineRetailers}/${totalRetailers} retailers online (need ${config?.min_online_retailers_percentage || 50}%) - waiting for more`}
                    </span>
                  </p>
                )}
                {pendingOrders.length > 0 && (
                  <p className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-700">
                      {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} sent to available retailers, waiting for acceptance. Will queue if no response in {config?.queue_retry_interval_minutes || 15} minutes.
                    </span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    Auto-checking every minute • Last check: {lastCheck.toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p className="font-semibold mb-1">System automatically:</p>
            <ul className="space-y-0.5 text-left">
              <li>• Sends to available retailers first</li>
              <li>• Queues only if no acceptance</li>
              <li>• Releases when shops open</li>
              <li>• Notifies customers of status</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
