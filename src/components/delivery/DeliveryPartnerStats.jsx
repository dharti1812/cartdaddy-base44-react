import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Star, IndianRupee } from "lucide-react";

export default function DeliveryPartnerStats({ deliveryPartner, activeDeliveries, completedToday }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeDeliveries}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Today</p>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <p className="text-2xl font-bold text-amber-600">
                {deliveryPartner.rating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <Star className="w-8 h-8 text-amber-600 opacity-20 fill-amber-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Earnings</p>
              <p className="text-2xl font-bold text-emerald-600">₹{deliveryPartner.total_earnings || 0}</p>
            </div>
            <IndianRupee className="w-8 h-8 text-emerald-600 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}