import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Package,
  User,
  MapPin,
  Phone,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/api/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/config";

const statusConfig = {
  pending_acceptance: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  assigned: {
    label: "Assigned",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  en_route: {
    label: "En Route",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  arrived: {
    label: "Arrived",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  otp_verified: {
    label: "OTP Verified",
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

export default function OrderDetails({ order, retailers, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(
    order.assign_seller || ""
  );
  const [approvedSellers, setApprovedSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchApprovedSellers = async () => {
      setSelectedRetailer(order.assign_seller || "");

      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/api/sellers/approved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("API Response:", data);

        if (data.success && Array.isArray(data.sellers)) {
          setApprovedSellers(data.sellers);
        } else {
          console.warn("Invalid response format:", data);
          setApprovedSellers([]);
        }
      } catch (error) {
        console.error("Failed to fetch approved Sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedSellers();
  }, []);

  const handleAssignRetailer = async () => {
    if (!selectedRetailer) return;

    setUpdating(true);

    try {
      const token = sessionStorage.getItem("token");
      //alert("orderId: " + order.order_id + " retailerId: " + selectedRetailer);
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.order_id}/assign-retailer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            retailer_id: selectedRetailer,
            assignment_status: "assigned",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Retailer assigned successfully:", data);
        onUpdate();
      } else {
        console.error("Failed to assign retailer:", data);
      }
    } catch (error) {
      console.error("Error assigning retailer:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    alert("Changing status to: " + newStatus);
    setUpdating(true);
    await Order.update(order.id, { status: newStatus });
    setUpdating(false);
    onUpdate();
  };

  const availableRetailers = retailers.filter(
    (r) => r.status === "active" && r.availability_status === "online"
  );

  return (
    <Card className="border-none shadow-lg sticky top-4">
      <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">
          Order Details
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{`#${order.id}`}</h3>
            <Badge className={`${statusConfig[order.status]?.color} border`}>
              {statusConfig[order.status]?.label}
            </Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {order.customer_name}
                </p>
                <p className="text-gray-600">{order.customer_masked_contact}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 mb-1">
                  Delivery Address
                </p>
                <p className="text-gray-600">{order.drop_address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Created</p>
                <p className="text-gray-600">
                  {format(new Date(order.created_date), "PPpp")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">₹{item.price}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{order.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              {order.delivery_charge && order.delivery_charge != null && (
                <>
                  <span className="text-gray-600">Delivery Charge</span>
                  <span className="font-medium">₹{order.delivery_charge}</span>
                </>
              )}
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {order.amount}
              </span>
            </div>
          </div>
        </div>

        {order.status === "pending" && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Assign Retailer
            </h3>
            <div className="space-y-3">
              <Select
                value={selectedRetailer}
                onValueChange={setSelectedRetailer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {approvedSellers.length > 0 ? (
                    approvedSellers.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name} — {shop.user?.name || "Unknown Retailer"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled>
                      No approved retailers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignRetailer}
                disabled={!selectedRetailer || updating}
                className="w-full bg-blue-900 hover:bg-blue-800"
              >
                Assign & Start Delivery
              </Button>
            </div>
          </div>
        )}

        {order.status !== "pending_acceptance" &&
          order.status !== "delivered" && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Update Status
              </h3>
              <div className="space-y-2">
                {order.assignment_status === "assigned" && (
                  <Button
                    onClick={() => handleStatusChange("en_route")}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    Mark as En Route
                  </Button>
                )}
                {order.status === "en_route" && (
                  <Button
                    onClick={() => handleStatusChange("arrived")}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    Mark as Arrived
                  </Button>
                )}
                {order.status === "arrived" && (
                  <Button
                    onClick={() => handleStatusChange("delivered")}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
              </div>
            </div>
          )}

        {order.payment_status !== "paid" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Payment Pending</p>
                <p className="text-sm text-amber-700 mt-1">
                  Payment status: {order.payment_status}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
