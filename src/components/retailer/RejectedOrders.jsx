import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileWarning,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function RejectedOrders({ orders }) {
  const [modal, setModal] = useState({ open: false, type: null, url: null });

  if (!orders || orders.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">
            No Rejected Orders
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Rejected order history will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 relative">
     
      {modal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-lg shadow-lg">
          
            <button
              className="absolute top-3 right-3 z-50 bg-white rounded-full p-1 hover:bg-gray-100 shadow-md"
              onClick={() => setModal({ open: false, type: null, url: null })}
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

           
            {modal.type === "photo" ? (
              <img
                src={modal.url}
                alt="Photo Evidence"
                className="w-full h-auto object-contain rounded-lg"
              />
            ) : (
              <video
                src={modal.url}
                controls
                className="w-full h-auto object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

     
      {orders.map((order, index) => (
        <Card
          key={`${order.order_id}-${index}`}
          className="border-l-4 border-red-500 bg-gradient-to-r from-red-50/40 to-white shadow-sm hover:shadow-lg transition"
        >
          <CardContent className="p-5 space-y-4">

           
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm text-gray-900">
                  Order #{order.order_id}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rejected on{" "}
                  {format(
                    new Date(order.rejected_at),
                    "dd MMM yyyy, hh:mm a"
                  )}
                </p>
              </div>

              <Badge className="bg-red-600/10 text-red-700 border border-red-300 px-3 py-1 text-xs font-semibold">
                ❌ {order.type.toUpperCase()} REJECTED
              </Badge>
            </div>

           
            <div className="bg-gray-50 rounded-md p-2 flex gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Rejection Reason
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{order.reason}</p>
              </div>
            </div>

           
            {order.penalty && (
              <div className="border border-red-200 bg-red-50 rounded-md p-2 space-y-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="font-semibold text-sm">Penalty Applied</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Penalty Reason</p>
                    <p className="font-medium text-gray-800">
                      {order.penalty.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Pickup Distance</p>
                    <p className="font-medium text-gray-800">
                      {order.penalty.distance_km} km
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Penalty Amount</p>
                    <p className="font-bold text-red-700 flex items-center gap-1 text-base drop-shadow-sm">
                      <IndianRupee className="w-4 h-4" />
                      {Number(order.penalty.amount).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            
            <div className="flex gap-5 text-sm pt-2 border-t">
              {order.photo_url && (
                <button
                  onClick={() =>
                    setModal({ open: true, type: "photo", url: order.photo_url })
                  }
                  className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 hover:underline"
                >
                  <FileWarning className="w-4 h-4" />
                  Photo Evidence
                </button>
              )}

              {order.video_url && (
                <button
                  onClick={() =>
                    setModal({ open: true, type: "video", url: order.video_url })
                  }
                  className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 hover:underline"
                >
                  <FileWarning className="w-4 h-4" />
                  Video Evidence
                </button>
              )}
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
