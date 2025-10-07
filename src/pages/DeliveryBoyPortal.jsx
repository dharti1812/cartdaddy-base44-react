
import React, { useState, useEffect } from "react";
import { DeliveryPartner, Order, Retailer, User } from '@/components/utils/mockApi';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, LogOut, RefreshCw, AlertCircle, Store, Monitor, Smartphone, TrendingUp, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

import SelectRetailers from "../components/delivery/SelectRetailers";

export default function DeliveryBoyPortal() {
  const [partner, setPartner] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔄 Loading delivery partner data...");
      
      let user;
      try {
        user = await User.me();
        console.log("✅ User found:", user.email);
      } catch (err) {
        console.log("❌ No user session");
        window.location.href = createPageUrl("DeliveryBoyLogin");
        return;
      }

      const allPartners = await DeliveryPartner.list();
      console.log("📋 Total partners:", allPartners.length);
      
      const myPartners = allPartners.filter(p => p.email === user.email);
      console.log("✅ My partners:", myPartners.length);
      
      if (myPartners.length === 0) {
        console.log("❌ No partner profile");
        window.location.href = createPageUrl("DeliveryPartnerOnboarding");
        return;
      }

      let partnerData = myPartners[0];

      if (myPartners.length > 1) {
        console.log("⚠️ Cleaning duplicates...");
        const sorted = myPartners.sort((a, b) => {
          if (a.onboarding_status === 'approved' && b.onboarding_status !== 'approved') return -1;
          if (b.onboarding_status === 'approved' && a.onboarding_status !== 'approved') return 1;
          return new Date(b.created_date) - new Date(a.created_date);
        });
        
        partnerData = sorted[0];
        for (const dup of sorted.slice(1)) {
          await DeliveryPartner.delete(dup.id);
        }
      }

      if (partnerData.status === 'suspended') {
        setError("Your account has been suspended. Contact support.");
        setLoading(false);
        return;
      }

      if (partnerData.onboarding_status !== 'approved') {
        console.log("⚠️ Not approved");
        window.location.href = createPageUrl("DeliveryPartnerOnboarding");
        return;
      }

      setPartner(partnerData);
      
      const allOrders = await Order.list("-created_date");
      setOrders(allOrders);
      
      setLoading(false);
      console.log("✅ Portal loaded");

    } catch (error) {
      console.error("❌ Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('delivery_partner_identifier');
    window.location.href = createPageUrl("PortalSelector");
  };

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-white mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1 bg-[#FFEB3B] text-black">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex-1 border-white text-white">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Delivery Portal...</p>
        </div>
      </div>
    );
  }

  // NO PARTNER STATE
  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Profile Found</h2>
            <p className="text-white mb-4">Complete onboarding first.</p>
            <Button 
              onClick={() => window.location.href = createPageUrl("DeliveryPartnerOnboarding")} 
              className="bg-[#FFEB3B] text-black"
            >
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate orders
  const availableOrders = orders.filter(o => 
    ['pending_acceptance', 'queued', 'accepted_primary'].includes(o.status) &&
    o.awaiting_delivery_boy === true &&
    !o.assigned_delivery_boy &&
    (!o.preferred_vehicle_type || o.preferred_vehicle_type === partner.vehicle_type)
  );

  const myActiveDeliveries = orders.filter(o => 
    o.assigned_delivery_boy?.id === partner.id &&
    !['delivered', 'cancelled'].includes(o.status)
  );

  const completedToday = orders.filter(o => {
    if (o.assigned_delivery_boy?.id !== partner.id || o.status !== 'delivered') return false;
    const today = new Date().toDateString();
    return new Date(o.actual_delivery_time || o.updated_date).toDateString() === today;
  }).length;

  // MAIN RENDER
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] ${mobileView ? 'max-w-md mx-auto' : ''}`}>
      {/* Mobile View Toggle */}
      {typeof window !== 'undefined' && window.innerWidth > 768 && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setMobileView(!mobileView)}
            variant="outline"
            size="sm"
            className="bg-white border-2 border-[#FFEB3B]"
          >
            {mobileView ? <Monitor className="w-4 h-4 mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
            <span className="text-black">{mobileView ? 'Desktop' : 'Mobile'} View</span>
          </Button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        {/* Header Card */}
        <div className="mb-6">
          <Card className="bg-[#075E66] border-2 border-[#FFEB3B]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFEB3B] rounded-full flex items-center justify-center text-black font-bold text-xl">
                    {partner.full_name?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{partner.full_name}</h2>
                    <p className="text-[#FFEB3B] text-base">{partner.phone}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="border-2 border-[#FFEB3B] text-[#FFEB3B] hover:bg-[#FFEB3B] hover:text-black"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">My Stats</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Active</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{myActiveDeliveries.length}</p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Today</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{completedToday}</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{availableOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">
                  Available Orders
                  {availableOrders.length > 0 && (
                    <Badge className="ml-2 bg-red-500">{availableOrders.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  My Deliveries
                  {myActiveDeliveries.length > 0 && (
                    <Badge className="ml-2 bg-blue-500">{myActiveDeliveries.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="retailers">
                  <Store className="w-4 h-4 mr-2" />
                  My Sellers
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4">
              <TabsContent value="available" className="mt-0">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Available</h3>
                    <p className="text-gray-500 text-sm">New delivery requests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map(order => (
                      <Card key={order.id} className="border-2 border-green-500">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-2">
                            {order.website_ref || `Order #${order.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">Customer: {order.customer_name}</p>
                          <p className="text-sm text-gray-600 mb-4">
                            📍 {order.drop_address?.street}, {order.drop_address?.city}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">₹{order.total_amount}</span>
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                              Accept Order
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                {myActiveDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Deliveries</h3>
                    <p className="text-gray-500 text-sm">Your accepted deliveries will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myActiveDeliveries.map(order => (
                      <Card key={order.id} className="border-2 border-blue-500">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-2">
                            {order.website_ref || `Order #${order.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">Customer: {order.customer_name}</p>
                          <p className="text-sm text-gray-600 mb-4">
                            📍 {order.drop_address?.street}, {order.drop_address?.city}
                          </p>
                          <Badge className="bg-blue-500 text-white">
                            Status: {order.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="retailers" className="mt-0">
                <SelectRetailers deliveryPartnerId={partner.id} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
