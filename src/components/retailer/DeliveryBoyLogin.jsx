import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Smartphone, LogIn, LogOut } from "lucide-react";
import { Retailer } from "@/api/entities";

export default function DeliveryBoyLogin({ retailerId, retailerProfile, onUpdate }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [deliveryBoyName, setDeliveryBoyName] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const deliveryBoys = retailerProfile?.delivery_boys || [];
  const activeDeliveryBoys = deliveryBoys.filter(db => db.is_active);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);

    const deviceId = localStorage.getItem('cart_daddy_device_id') || 'delivery_' + Date.now();
    const deviceName = /mobile/i.test(navigator.userAgent) ? 'Mobile Device' : 
                       /tablet/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop/Laptop';

    const newDeliveryBoy = {
      id: 'db_' + Date.now(),
      name: deliveryBoyName,
      device_id: deviceId,
      device_name: deviceName,
      is_active: true,
      current_order_id: null,
      logged_in_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    const updatedDeliveryBoys = [...deliveryBoys, newDeliveryBoy];

    await Retailer.update(retailerId, {
      delivery_boys: updatedDeliveryBoys
    });

    localStorage.setItem('cart_daddy_device_id', deviceId);

    setLoggingIn(false);
    setShowLoginForm(false);
    setDeliveryBoyName("");
    onUpdate();
  };

  const handleLogout = async (deliveryBoyId) => {
    const updatedDeliveryBoys = deliveryBoys.map(db => 
      db.id === deliveryBoyId ? {...db, is_active: false} : db
    );

    await Retailer.update(retailerId, {
      delivery_boys: updatedDeliveryBoys
    });

    onUpdate();
  };

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Delivery Partners</span>
          </div>
          {!showLoginForm && (
            <Button 
              size="sm" 
              onClick={() => setShowLoginForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {showLoginForm && (
          <form onSubmit={handleLogin} className="space-y-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <div>
              <Label htmlFor="db-name">Your Name *</Label>
              <Input
                id="db-name"
                value={deliveryBoyName}
                onChange={(e) => setDeliveryBoyName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loggingIn} className="flex-1 bg-green-600 hover:bg-green-700">
                {loggingIn ? "Logging in..." : "Start Working"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowLoginForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {activeDeliveryBoys.length === 0 ? (
          <div className="text-center py-6">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No delivery partners logged in</p>
            <p className="text-gray-400 text-xs mt-1">Login to start accepting deliveries</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Active Partners</p>
            {activeDeliveryBoys.map((db) => (
              <div key={db.id} className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {db.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{db.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Smartphone className="w-3 h-3" />
                      <span>{db.device_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  {db.current_order_id ? (
                    <Badge className="bg-amber-500 text-white">
                      On Delivery
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white">
                      Available
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleLogout(db.id)}
                    className="w-full text-xs"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Logout
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {deliveryBoys.filter(db => !db.is_active).length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recently Logged Out</p>
            {deliveryBoys.filter(db => !db.is_active).slice(0, 3).map((db) => (
              <div key={db.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">{db.name}</p>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                  Offline
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}