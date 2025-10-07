
import React, { useState, useEffect, useCallback } from 'react';
import { Order, Retailer, User, DeliveryPartner } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, MapPin, Navigation, IndianRupee, Clock, AlertTriangle, CheckCircle, Bell, TrendingUp
} from "lucide-react";
import { format } from "date-fns";

import DeliveryBoyLogin from "../components/retailer/DeliveryBoyLogin";
import LocationTracker from "../components/retailer/LocationTracker";
import AvailableOrdersForDeliveryBoy from "../components/retailer/AvailableOrdersForDeliveryBoy";
import MyDeliveriesForDeliveryBoy from "../components/retailer/MyDeliveriesForDeliveryBoy";
import DeliveryBoyStats from "../components/retailer/DeliveryBoyStats";

export default function DeliveryPartnerLogin() {
  const [retailerProfile, setRetailerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      const retailers = await Retailer.filter({ email: user.email });
      
      if (retailers.length > 0) {
        const retailer = retailers[0];
        setRetailerProfile(retailer);

        const allOrders = await Order.list("-created_date", 100);
        setOrders(allOrders);

        // Check for new orders awaiting delivery boy acceptance
        const availableOrders = allOrders.filter(o => 
          o.active_retailer_id === retailer.id &&
          o.awaiting_delivery_boy === true &&
          !o.assigned_delivery_boy
        );
        
        if (availableOrders.length > newOrdersCount) {
          // New orders detected - play notification sound
          playNotificationSound();
        }
        setNewOrdersCount(availableOrders.length);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  }, [newOrdersCount]);

  useEffect(() => {
    loadData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 5000); // Refresh every 5 seconds for real-time updates
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadData]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVanp8a1aGAg+ltryxWgiBS176O2VRQ0PUanp8K1aGAc+l9nyxmgjBS146O2URQ0QUqnp8K1aGAc+l9nyxmgjBS156O2URQ0QUqnp8K1aGAc9l9nyxmgjBS156O2URQ0QU6np8K5aGAc9l9ryxmgjBS156O2URQ0QU6np8K5aGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBS556O2URQ0PVKnp8K5ZGAc9l9ryxmgjBQ==');
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.log("Notification sound error:", error);
    }
  };

  // Get current delivery boy if logged in
  const currentDeviceId = localStorage.getItem('cart_daddy_device_id');
  const currentDeliveryBoy = retailerProfile?.delivery_boys?.find(
    db => db.device_id === currentDeviceId && db.is_active
  );

  // Available orders for delivery boys (retailer accepted, waiting for DB assignment)
  const availableOrders = orders.filter(o => 
    o.active_retailer_id === retailerProfile?.id &&
    o.awaiting_delivery_boy === true &&
    !o.assigned_delivery_boy
  );

  // My active deliveries (assigned to me)
  const myDeliveries = orders.filter(o =>
    o.assigned_delivery_boy?.id === currentDeliveryBoy?.id &&
    !['delivered', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5b736] mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png" 
              alt="Cart Daddy Logo" 
              className="h-20 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Delivery Partner Portal</h1>
              <p className="text-white opacity-90 mt-1">
                {retailerProfile?.full_name} • {currentDeliveryBoy ? `Logged in as ${currentDeliveryBoy.name}` : 'Not logged in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 font-bold" : "bg-white text-[#075E66] hover:bg-gray-100 border-2 border-[#F4B321] font-bold"}
            >
              <Bell className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? "Live Updates ON" : "Live Updates OFF"}
            </Button>
            {newOrdersCount > 0 && (
              <Badge className="bg-[#F4B321] text-gray-900 animate-pulse font-bold">
                {newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''}!
              </Badge>
            )}
          </div>
        </div>

        {/* Location Tracker */}
        {currentDeliveryBoy && currentDeliveryBoy.current_order_id && (
          <LocationTracker
            deliveryBoyId={currentDeliveryBoy.id}
            retailerId={retailerProfile.id}
            retailerProfile={retailerProfile}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Login Section */}
          <div className="lg:col-span-1">
            <DeliveryBoyLogin 
              retailerId={retailerProfile.id}
              retailerProfile={retailerProfile}
              onUpdate={loadData}
            />

            {currentDeliveryBoy && (
              <div className="mt-6">
                <DeliveryBoyStats
                  deliveryBoy={currentDeliveryBoy}
                  orders={orders}
                  retailerId={retailerProfile.id}
                />
              </div>
            )}
          </div>

          {/* Right: Orders Section */}
          <div className="lg:col-span-2">
            {!currentDeliveryBoy ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Not Logged In</h3>
                  <p className="text-gray-500">Login as a delivery partner to see available orders</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border">
                  <TabsTrigger value="available" className="relative">
                    Available Orders
                    {availableOrders.length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white">
                        {availableOrders.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="my-deliveries" className="relative">
                    My Deliveries
                    {myDeliveries.length > 0 && (
                      <Badge className="ml-2 bg-blue-500 text-white">
                        {myDeliveries.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <AvailableOrdersForDeliveryBoy
                    orders={availableOrders}
                    deliveryBoy={currentDeliveryBoy}
                    retailerId={retailerProfile.id}
                    retailerProfile={retailerProfile}
                    onAccept={loadData}
                  />
                </TabsContent>

                <TabsContent value="my-deliveries">
                  <MyDeliveriesForDeliveryBoy
                    orders={myDeliveries}
                    deliveryBoy={currentDeliveryBoy}
                    retailerId={retailerProfile.id}
                    retailerProfile={retailerProfile}
                    onUpdate={loadData}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
