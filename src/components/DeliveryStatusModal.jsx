import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";

export default function DeliveryStatusModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.delivery_status);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusFlow = ["pending", "picked_up", "out_for_delivery", "delivered"];
  const currentIndex = statusFlow.indexOf(status);
  const nextStatuses = statusFlow.slice(currentIndex + 1);
  React.useEffect(() => {
    if (status === "out_for_delivery") {
      setShowOtp(true);
    }
  }, [status]);

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/update-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            status: newStatus,
          }),
        }
      );

      const data = await res.json();
      setStatus(newStatus);

      if (newStatus === "out_for_delivery") {
        sendOtpToCustomer(order.id);
        setShowOtp(true);
        onClose();
      } else {
        onClose();
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Status update error:", err);
    }
    setLoading(false);
  };

  const sendOtpToCustomer = async (orderId) => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/delivery-partner/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      const data = await res.json();
      console.log("OTP sent:", data);
    } catch (error) {
      console.error("Send OTP error:", error);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            otp: otp,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Delivery Completed");
        updateStatus("delivered");
        onClose();
      } else {
        alert("Invalid OTP");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">Update Delivery Status</h2>
        <p className="mb-4 font-semibold">Order #{order.id}</p>

        {!showOtp && (
          <div className="space-y-3">
            {nextStatuses.includes("picked_up") && (
              <Button
                className="w-full bg-yellow-500"
                disabled={loading}
                onClick={() => updateStatus("picked_up")}
              >
                Picked Up
              </Button>
            )}

            {nextStatuses.includes("out_for_delivery") && (
              <Button
                className="w-full bg-blue-500"
                disabled={loading}
                onClick={() => updateStatus("out_for_delivery")}
              >
                Out for Delivery
              </Button>
            )}
          </div>
        )}

        {showOtp && (
          <div className="mt-4">
            <input
              type="number"
              className="border w-full p-2 rounded-lg mb-4"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button
              className="w-full bg-green-600"
              disabled={loading}
              onClick={verifyOtp}
            >
              Verify OTP
            </Button>
          </div>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
