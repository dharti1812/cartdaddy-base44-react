import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, IndianRupee, Navigation, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function DeliveryHistoryDP({ deliveries, deliveryPartner }) {
  if (!deliveries || deliveries.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Delivery History</h3>
          <p className="text-gray-500">Your completed deliveries will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery, index) => {
        const isExcessiveDeviation = delivery.deviation_percentage > 15;
        
        return (
          <Card key={index} className={`border-2 ${
            delivery.status === 'delivered' ? 'border-green-200' :
            delivery.status === 'cancelled' ? 'border-red-200' :
            'border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Order #{delivery.order_id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(delivery.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Badge className={
                  delivery.status === 'delivered' ? 'bg-green-600' :
                  delivery.status === 'cancelled' ? 'bg-red-600' :
                  'bg-gray-600'
                }>
                  {delivery.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Expected</p>
                  <p className="font-bold text-gray-900">{delivery.expected_distance_km.toFixed(1)} km</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Actual</p>
                  <p className="font-bold text-gray-900">{delivery.actual_distance_km.toFixed(1)} km</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  isExcessiveDeviation ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50'
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Deviation</p>
                  <p className={`font-bold ${isExcessiveDeviation ? 'text-red-700' : 'text-gray-900'}`}>
                    {delivery.deviation_percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Earned</p>
                  <p className="font-bold text-green-700">₹{delivery.earnings}</p>
                </div>
              </div>

              {isExcessiveDeviation && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-900">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Excessive route deviation detected</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}