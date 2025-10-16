import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, IndianRupee, Store, Phone, User, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersList({ orders, loading, onSelectOrder, selectedOrderId }) {
  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-4 space-y-3">
          {Array(6).fill(0).map((_, i) => ( // Changed from 8 to 6
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-0">
        <div className="divide-y">
          {orders.map((order) => {
            // Get seller info
            const sellerInfo = order.active_retailer_info || order.accepted_retailers?.[0];
            const sellerName = sellerInfo?.retailer_name || 'Unknown Seller';
            const shopName = sellerInfo?.retailer_business_name || '';
            
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedOrderId === order.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {order.website_ref || `#${order.id.slice(0, 8)}`}
                      </h3>
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      {order.is_cod && (
                        <Badge className="bg-green-100 text-green-800">COD</Badge>
                      )}
                      {order.sla_breach && (
                        <Badge className="bg-red-100 text-red-800">SLA Breach</Badge>
                      )}
                    </div>

                    {/* Display Owner Name + Shop Name */}
                    {(sellerName || shopName) && (
                      <div className="mb-2 flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          <strong>{shopName}</strong>
                          {shopName && sellerName && ' - '}
                          {sellerName}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{order.drop_address?.street}, {order.drop_address?.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(order.created_date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-gray-900">₹{order.total_amount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'en_route': return 'bg-blue-100 text-blue-800';
    case 'pending_acceptance': return 'bg-amber-100 text-amber-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'assigned': return 'bg-purple-100 text-purple-800'; // Added assigned status
    default: return 'bg-gray-100 text-gray-800';
  }
}
