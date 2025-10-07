
import React, { useState, useEffect, useCallback } from 'react';
import { Order, DeliveryPartner, User } from '@/components/utils/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, MapPin, Navigation, IndianRupee, Clock, Bell, 
  TrendingUp, User as UserIcon, LogOut, Activity
} from "lucide-react";
import { createPageUrl } from "@/utils";

import DeliveryPartnerStats from "../components/delivery/DeliveryPartnerStats";
import AvailableOrdersForDP from "../components/delivery/AvailableOrdersForDP";
import MyActiveDeliveries from "../components/delivery/MyActiveDeliveries";
import DeliveryHistoryDP from "../components/delivery/DeliveryHistoryDP";
import DPLocationTracker from "../components/delivery/DPLocationTracker"; // Using DPLocationTracker as per existing imports, adjusting props as per outline

export default function DeliveryPartnerPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentDeliveryPartner, setCurrentDeliveryPartner] = useState(null); // Renamed from deliveryPartner
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true); // Re-introduced autoRefresh state
  const [activeTab, setActiveTab] = useState("available");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Find delivery partner profile
      const partners = await DeliveryPartner.filter({ email: user.email });
      
      if (partners.length === 0) {
        // No profile found - redirect to onboarding
        window.location.href = createPageUrl("DeliveryPartnerOnboarding");
        return;
      }
      
      const partner = partners[0];
      
      // Check onboarding status
      if (partner.onboarding_status !== 'approved') {
        window.location.href = createPageUrl("DeliveryPartnerOnboarding");
        return;
      }
      
      setCurrentDeliveryPartner(partner); // Renamed state update
      
      // Get all orders from partnered retailers
      const partneredRetailerIds = partner.partnered_retailers
        ?.filter(pr => pr.partnership_status === 'approved')
        .map(pr => pr.retailer_id) || [];
      
      if (partneredRetailerIds.length > 0) {
        const allOrders = await Order.list("-created_date", 100);
        
        // Filter orders from my partnered retailers
        const relevantOrders = allOrders.filter(order => 
          partneredRetailerIds.includes(order.active_retailer_id)
        );
        
        setOrders(relevantOrders);
        
        // Count new available orders
        const availableOrders = relevantOrders.filter(o => 
          o.awaiting_delivery_boy === true &&
          !o.assigned_delivery_boy
        );
        
        // Play sound only if new orders appeared compared to the previous count, and not on initial load
        if (availableOrders.length > newOrdersCount && newOrdersCount !== 0) {
          playNotificationSound();
        }
        setNewOrdersCount(availableOrders.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      // For production, consider a more user-friendly error display or specific redirects
      // window.location.href = createPageUrl("DeliveryPartnerOnboarding"); 
    }
  }, [newOrdersCount]); // newOrdersCount is a dependency to ensure loadData has the latest count for comparison

  useEffect(() => {
    // Load data initially on component mount
    loadData();

    // Re-introducing auto-refresh interval based on autoRefresh state
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadData, autoRefresh]); // autoRefresh dependency added back

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVanp8a1aGAg+ltryxWgiBS176O2VRQ0PUanp8K1aGAc+l9nyxmgjBS146O2URQ0QUqnp8K1aGAc9l9nyxmgjBS156O2URQ0QU6np8K5aGAc9l9ryxmgjBS156O2URQ0QU6np8K5aGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBQ==');
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.log("Notification sound error:", error);
    }
  };

  const handleLogout = async () => {
    // Ensure currentDeliveryPartner is not null before attempting update
    if (currentDeliveryPartner) {
        await DeliveryPartner.update(currentDeliveryPartner.id, {
            availability_status: 'offline',
            active_device_session: null
        });
    }
    await User.logout();
    // Redirect or perform other logout actions if needed
    window.location.href = createPageUrl("Login"); // Example redirect
  };

  // Available orders from all partnered retailers
  const availableOrders = orders.filter(o => 
    o.awaiting_delivery_boy === true &&
    !o.assigned_delivery_boy
  );

  // My active deliveries
  const myDeliveries = orders.filter(o =>
    o.assigned_delivery_boy?.id === currentDeliveryPartner?.id &&
    !['delivered', 'cancelled'].includes(o.status)
  );

  // My completed deliveries
  const completedDeliveries = orders.filter(o =>
    o.assigned_delivery_boy?.id === currentDeliveryPartner?.id &&
    ['delivered', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle case where currentDeliveryPartner might be null after loading (e.g., redirect failed)
  if (!currentDeliveryPartner) {
    return null; // Or show a specific error/redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54]">
      {/* Location Tracker - Active during delivery */}
      {currentDeliveryPartner && currentDeliveryPartner.current_order_id && (
        <DPLocationTracker // Using DPLocationTracker as per existing imports
          deliveryPartnerId={currentDeliveryPartner.id}
          deliveryPartner={currentDeliveryPartner} // Added deliveryPartner prop as per outline
        />
      )}

      {/* Standalone Header */}
      <div className="bg-[#075E66] text-white p-4 md:p-6 sticky top-0 z-10 shadow-lg border-b-4 border-[#F4B321]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png" 
                alt="Cart Daddy Logo" 
                className="h-20 w-auto" // Adjusted height as per outline
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Delivery Partner Portal</h1>
                <p className="text-white text-opacity-80 text-sm md:text-base mt-1">
                  {currentDeliveryPartner ? `${currentDeliveryPartner.full_name}` : 'Not logged in'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-refresh toggle button */}
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-[#F4B321] hover:bg-[#e0a020] text-gray-900 font-semibold" : "bg-white text-[#075E66] hover:bg-gray-100"}
                title={autoRefresh ? "Auto-refresh is ON (Live)" : "Auto-refresh is OFF"}
              >
                <Bell className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? "Live" : "Off"}
              </Button>
              {/* New Orders Count Badge */}
              {newOrdersCount > 0 && (
                <Badge className="bg-[#F4B321] text-gray-900 animate-pulse font-semibold">
                  {newOrdersCount}
                </Badge>
              )}
              {/* Logout Button (re-added as it's critical functionality) */}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleLogout} title="Logout">
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Logout</span> {/* Accessibility for icon-only button */}
              </Button>
            </div>
          </div>

          {currentDeliveryPartner && (
            <DeliveryPartnerStats
              deliveryPartner={currentDeliveryPartner}
              activeDeliveries={myDeliveries.length} // Retaining existing computed props
              completedToday={completedDeliveries.filter(o => { // Retaining existing computed props
                const today = new Date().toDateString();
                return new Date(o.updated_date).toDateString() === today;
              }).length}
              orders={orders} // Added orders prop as per outline
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {newOrdersCount > 0 && activeTab !== 'available' && (
          <Alert className="mb-4 bg-amber-50 border-amber-500 animate-pulse">
            <Bell className="w-5 h-5 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-900 font-bold">
                🎉 {newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''} Available!
              </span>
              <Button size="sm" onClick={() => setActiveTab('available')} className="bg-[#075E66] hover:bg-[#075E66]/90 text-white">
                View Orders
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border">
            <TabsTrigger value="available" className="relative">
              Available Orders
              {availableOrders.length > 0 && (
                <Badge className="ml-2 bg-[#F4B321] text-gray-900">
                  {availableOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="relative">
              My Deliveries
              {myDeliveries.length > 0 && (
                <Badge className="ml-2 bg-[#F4B321] text-gray-900">
                  {myDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <AvailableOrdersForDP
              orders={availableOrders}
              deliveryPartner={currentDeliveryPartner}
              onAccept={loadData}
            />
          </TabsContent>

          <TabsContent value="active">
            <MyActiveDeliveries
              orders={myDeliveries}
              deliveryPartner={currentDeliveryPartner}
              onUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="history">
            <DeliveryHistoryDP
              deliveries={currentDeliveryPartner.delivery_history || []}
              deliveryPartner={currentDeliveryPartner}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
