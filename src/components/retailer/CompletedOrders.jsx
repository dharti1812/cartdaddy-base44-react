import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, IndianRupee, CheckCircle, XCircle, Clock, Navigation } from "lucide-react";
import { format } from "date-fns";

export default function CompletedOrders({ orders }) {
  if (orders.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Completed Orders</h3>
          <p className="text-gray-500">Your delivery history will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id} className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {order.website_ref || `#${order.id.slice(0, 8)}`}
                  </h3>
                  <Badge className={`${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  } border`}>
                    {order.status === 'delivered' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Delivered</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Cancelled</>
                    )}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{order.drop_address?.city}</span>
                    {order.distance_km && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Navigation className="w-3 h-3" />
                        <span>{order.distance_km} km</span>
                      </>
                    )}
                  </div>
                  {order.actual_delivery_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(order.actual_delivery_time), "MMM d, h:mm a")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-gray-900 mb-1">
                  <IndianRupee className="w-4 h-4" />
                  {order.total_amount}
                </div>
                {order.status === 'delivered' && (
                  <p className="text-xs text-green-600 font-medium">
                    Earned: ₹{(order.total_amount * 0.05).toFixed(0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}