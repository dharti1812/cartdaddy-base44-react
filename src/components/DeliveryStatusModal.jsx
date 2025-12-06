import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";

export default function DeliveryStatusModal({
  order,
  onClose,
  onUpdate,
  onRemove,
}) {
  const [status, setStatus] = useState(order.delivery_status);
  const [otp, setOtp] = useState("");
  const [sellerOtp, setSellerOtp] = useState(false);
  const [customerOtp, setCustomerOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  useEffect(() => {
    if (status === "reached_to_seller") setSellerOtp(true);
    if (status === "out_for_delivery") setCustomerOtp(true);
  }, [status]);

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/delivery-partner/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.id, status: newStatus }),
      });

      setStatus(newStatus);

      if (newStatus === "reached_to_seller") {
        setSellerOtp(true);
        await sendOtp("seller");
      } else if (newStatus === "out_for_delivery") {
        setCustomerOtp(true);
        await sendOtp("customer");
      }

      if (onRemove) onRemove(order.id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendOtp = async (type) => {
    const token = sessionStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/delivery-partner/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: order.id, type }),
    });
  };

  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");
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
            otp,
            type: sellerOtp ? "seller" : "customer",
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        if (sellerOtp) {
          setSellerOtp(false);
          setStatus("picked_up");
        } else if (customerOtp) {
          setCustomerOtp(false);
          setShowCustomerInfo(true); // show customer info step
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
    setOtp("");
    setLoading(false);
  };

  const submitCustomerInfo = async () => {
  if (!customerName || !deliveryPhoto)
    return alert("Enter name & upload photo");

  const formData = new FormData();
  formData.append("order_id", order.id);
  formData.append("delivery_verified_user_info", customerName);
  formData.append("delivery_verified_photo", deliveryPhoto);

  try {
    const token = sessionStorage.getItem("token");
   const res =  await fetch(`${API_BASE_URL}/api/delivery-partner/save-customer-info`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, 
      },
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      alert("Delivery Completed");
      if (onRemove) onRemove(order.id);
      if (onUpdate) onUpdate();
      onClose();
    } else {
      alert(data.error || "Something went wrong");
    }
  } catch (err) {
    console.error("Error submitting customer info:", err);
    alert("Failed to submit. Check console.");
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">Update Delivery Status</h2>
        <p className="mb-4 font-semibold">Order #{order.id}</p>

        {!sellerOtp &&
          !customerOtp &&
          !showCustomerInfo &&
          status !== "delivered" && (
            <div className="space-y-3">
              {status === "accepted" && (
                <Button
                  className="w-full bg-yellow-500"
                  onClick={() => updateStatus("reached_to_seller")}
                >
                  Reached to Seller
                </Button>
              )}
              {status === "reached_to_seller" && (
                <Button
                  className="w-full bg-blue-500"
                  onClick={() => updateStatus("picked_up")}
                >
                  Picked Up
                </Button>
              )}
              {status === "picked_up" && (
                <Button
                  className="w-full bg-purple-500"
                  onClick={() => updateStatus("out_for_delivery")}
                >
                  Out for Delivery
                </Button>
              )}
            </div>
          )}

        {(sellerOtp || customerOtp) && !showCustomerInfo && (
          <div className="mt-4 space-y-4">
            <input
              type="number"
              className="border w-full p-2 rounded-lg mb-4"
              placeholder={`Enter ${sellerOtp ? "Seller" : "Customer"} OTP`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button className="w-full bg-green-600" onClick={verifyOtp}>
              Verify OTP
            </Button>
          </div>
        )}

        {showCustomerInfo && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              className="border w-full p-2 rounded-lg"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <label className="block mb-1 font-semibold">
              Click Live Delivery Photo
            </label>
            <label className="cursor-pointer">
              <div className="bg-blue-600 text-white px-4 py-2 rounded text-center">
                Open Camera
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setDeliveryPhoto(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

            {deliveryPhoto && (
              <img
                src={URL.createObjectURL(deliveryPhoto)}
                className="mt-2 w-32 h-32 object-cover rounded border"
              />
            )}

            <Button
              className="w-full bg-green-700"
              onClick={submitCustomerInfo}
            >
              Submit & Complete Delivery
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
