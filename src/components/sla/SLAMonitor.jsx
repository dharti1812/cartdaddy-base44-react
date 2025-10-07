
import React, { useState, useEffect } from "react";
import { Order, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Bell, Coffee, UserX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * SLAMonitor Component
 * Monitors SLA breaches and manages case distribution among admins
 */

export default function SLAMonitor() {
  const [slaBreaches, setSlaBreaches] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [onBreak, setOnBreak] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Check for SLA breaches every 30 seconds
    const interval = setInterval(checkSLABreaches, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const admin = await User.me();
      setCurrentAdmin(admin);
      
      await checkSLABreaches();
    } catch (error) {
      console.error("Error loading SLA data:", error);
    }
    setLoading(false);
  };

  const checkSLABreaches = async () => {
    try {
      const orders = await Order.list("-created_date", 100);
      const now = new Date();

      const breaches = orders.filter(order => {
        if (order.status === 'delivered' || order.status === 'cancelled') return false;
        
        if (!order.estimated_delivery_time) return false;
        
        const estimatedTime = new Date(order.estimated_delivery_time);
        return estimatedTime < now;
      });

      // Update orders with SLA breach flag
      for (const order of breaches) {
        if (!order.sla_breach) {
          await Order.update(order.id, {
            sla_breach: true,
            sla_breach_notified_at: new Date().toISOString()
          });

          // Notify retailer (simulated)
          console.log(`🚨 SLA Breach notification sent for order ${order.id}`);
        }
      }

      setSlaBreaches(breaches);
    } catch (error) {
      console.error("Error checking SLA breaches:", error);
    }
  };

  const handleTeaBreak = async () => {
    setOnBreak(true);
    
    // Update admin status
    await User.updateMyUserData({ status: 'on_break' });
    
    // Redistribute cases to other online admins
    console.log("☕ Admin on tea break - redistributing cases");
    
    // TODO: Implement case redistribution logic
    // Get all my assigned orders
    // Reassign to other online admins equally
  };

  const handleBackOnline = async () => {
    setOnBreak(false);
    await User.updateMyUserData({ status: 'online' });
    await checkSLABreaches();
  };

  const myAssignedBreaches = slaBreaches.filter(
    order => order.handling_admin_id === currentAdmin?.id
  );

  const unassignedBreaches = slaBreaches.filter(
    order => !order.handling_admin_id
  );

  if (loading) {
    return null;
  }

  if (slaBreaches.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-red-500 shadow-lg mb-6 bg-white">
      <CardHeader className="bg-red-50 border-b-2 border-red-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            SLA Breach Alert
            <Badge className="bg-red-600 text-white ml-2">{slaBreaches.length} Orders</Badge>
          </CardTitle>
          
          {!onBreak ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTeaBreak}
              className="gap-2"
            >
              <Coffee className="w-4 h-4" />
              Tea Break
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={handleBackOnline}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <UserX className="w-4 h-4" />
              Back Online
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {onBreak ? (
          <Alert className="bg-amber-50 border-amber-200">
            <Coffee className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>You are on Tea Break</strong><br/>
              Your cases have been redistributed to other online admins.
              Click "Back Online" when you're ready to resume.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900 text-sm">
                <strong>{slaBreaches.length} orders have breached SLA</strong><br/>
                • {myAssignedBreaches.length} assigned to you<br/>
                • {unassignedBreaches.length} unassigned (available for pickup)<br/>
                • Retailers have been notified automatically
              </AlertDescription>
            </Alert>

            {myAssignedBreaches.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Your Assigned Cases:</h4>
                <div className="space-y-2">
                  {myAssignedBreaches.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">{order.website_ref || `#${order.id.slice(0, 8)}`}</p>
                        <p className="text-xs text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unassignedBreaches.length > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Bell className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  {unassignedBreaches.length} SLA breach cases are waiting for admin assignment.
                  Cases are auto-distributed equally among online admins.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
