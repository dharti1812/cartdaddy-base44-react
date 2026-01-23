import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { format } from "date-fns";

export default function CompletedOrders({ orders }) {
  const [zoomImage, setZoomImage] = React.useState(null);
  if (!orders || orders.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Completed Orders
          </h3>
          <p className="text-gray-500">
            Your completed orders will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order) => {
        const detail = order.order_details?.[0];

        const address = order.shipping_address
          ? JSON.parse(order.shipping_address)
          : {};
        const products = order.items || order.order_details || [];

        return (
          <Card
            key={order.id}
            className="border border-green-300 bg-green-50 shadow-sm hover:shadow-md transition"
          >
            <CardContent className="p-4 space-y-4">
              {/* HEADER */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900">
                      {order.website_ref || `Order #${order.code}`}
                    </h3>

                    <Badge className="bg-green-600 text-white flex items-center gap-1 px-3 py-1">
                      <CheckCircle className="w-4 h-4" />
                      Delivered
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{order.user?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1">
                        {address.address || "Address not available"}
                      </span>
                    </div>

                    {detail?.actual_delivery_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {format(
                            new Date(detail.actual_delivery_time),
                            "MMM d, yyyy • h:mm a",
                          )}
                        </span>
                      </div>
                    )}
                    {detail?.delivery_verified_photo && (
                      <div className="flex items-center gap-3 mt-2">
                        {detail.delivery_verified_photo_url && (
                          <img
                            src={detail.delivery_verified_photo_url}
                            alt="Delivery Verified"
                            className="w-12 h-12 rounded-full object-cover border cursor-pointer hover:scale-105 transition"
                            onClick={() =>
                              setZoomImage(detail.delivery_verified_photo_url)
                            }
                          />
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <span className="font-medium">Delivered To:</span>
                          <span className="text-gray-600">
                            {detail.delivery_verified_user_info}
                          </span>
                        </div>
                      </div>
                    )}
                    {zoomImage && (
                      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                       
                        <div className="relative">
                        
                          <button
                            onClick={() => setZoomImage(null)}
                            className="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-200 transition"
                          >
                            ✕
                          </button>

                          <img
                            src={zoomImage}
                            alt="Zoomed"
                            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PRODUCT DETAILS */}
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  <p className="font-semibold text-gray-800 text-sm">
                    Product Details
                  </p>
                </div>

                <div className="space-y-2">
                  {products.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-gray-900">
                          {item.product?.name ||
                            item.name ||
                            item.product_name ||
                            "Product"}
                        </p>

                        {/* <p className="text-xs text-gray-500">
                Qty: {item.quantity} × ₹{item.price}
              </p> */}
                      </div>

                      <p className="font-semibold text-gray-900">
                        {item.quantity} x ₹
                        {(item.quantity * item.price).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
