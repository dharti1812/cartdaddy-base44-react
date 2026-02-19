import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { set } from "date-fns";

export default function DeliveryStatusModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.delivery_status);
  const [otp, setOtp] = useState("");
  const [customerOtp, setCustomerOtp] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [canResend, setCanResend] = useState(true);
  const [otpTimer, setOtpTimer] = useState(30);
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState(false);

  const showOtpInput = status === "reached_to_customer" && !showCustomerInfo;
  const showCustomerForm = status === "otp_verified" || showCustomerInfo;
  const isCOD = order.payment_type === "cash_on_delivery";
  console.log(order);
  useEffect(() => {
    setStatus(order.delivery_status);
  }, [order]);

  const startOtpTimer = () => {
    setOtpTimer(30);
    setCanResend(false);

    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const updateStatus = async (newStatus) => {
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
          body: JSON.stringify({ order_id: order.id, status: newStatus }),
        },
      );

      const data = await res.json();

      setStatus(newStatus);

      if (newStatus === "out_for_delivery") {
        setStatus("in_transit");
        setCustomerOtp(false);
        await sendOtp("customer");
      } else if (newStatus === "reached_to_customer") {
        await sendOtp("customer");
        setCustomerOtp(true); // show OTP modal
      } else if (newStatus === "verification_review") {
        setCustomerOtp(false);
        await sendOtp("seller");
      }

      if (newStatus !== "reached_to_customer" && newStatus !== "otp_verified") {
        onUpdate && onUpdate(newStatus);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById("live-preview");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoBase64 = canvas.toDataURL("image/jpeg", 0.9);
    setDeliveryPhoto(photoBase64);
    closeCamera();
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const sendOtp = async (type) => {
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/delivery-partner/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.id, type }),
      });

      // Start countdown only after clicking Resend
      setOtpTimer(30);
      setCanResend(false); // disable resend until countdown ends

      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true); // allow resend again
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setCustomerOtp(true); // ensure OTP input is shown
    } catch (err) {
      console.error("Error sending OTP:", err);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return alert("Enter valid OTP");

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
          body: JSON.stringify({ order_id: order.id, otp }),
        },
      );

      const data = await res.json();
      if (data.success) {
        setCustomerOtp(false); // hide OTP input
        setStatus("out_for_delivery"); // set status to OTP verified
        setShowCustomerInfo(true); // show customer info form
        //onUpdate && onUpdate("otp_verified"); // update parent with OTP verified
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitCustomerInfo = async () => {
    if (!customerName || !deliveryPhoto)
      return alert("Customer name & photo required");

    if (isCOD && !cashReceived)
      return alert("Please confirm that cash has been received");

    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/save-customer-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            delivery_verified_user_info: customerName,
            delivery_verified_photo: deliveryPhoto,
            cash_received: isCOD ? cashReceived : false,
          }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setStatus("delivered");
        onUpdate && onUpdate("delivered");
        onClose();
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">Update Delivery Status</h2>
        <p className="mb-4 font-semibold">Order #{order.id}</p>

        {/* Status Buttons */}
        {!customerOtp && !showCustomerInfo && status !== "delivered" && (
          <div className="space-y-3">
            {status === "picked_up" && (
              <Button
                className="w-full bg-purple-500"
                onClick={() => updateStatus("out_for_delivery")}
              >
                Out for Delivery
              </Button>
            )}

            {status === "out_for_delivery" && (
              <Button
                className="w-full bg-purple-500"
                onClick={() => updateStatus("reached_to_customer")}
              >
                Reached Customer
              </Button>
            )}

            {status === "accepted_db" && (
              <Button
                className="w-full bg-purple-500"
                onClick={() => updateStatus("heading_to_seller")}
              >
                Heading to Seller
              </Button>
            )}

            {status === "heading_to_seller" && (
              <Button
                className="w-full bg-purple-500"
                onClick={() => updateStatus("reached_to_seller")}
              >
                Reached Seller
              </Button>
            )}

          
             
          </div>
        )}

        {/* OTP Verification */}
        {showOtpInput && (
          <div className="space-y-3">
            <p className="font-semibold">Enter OTP sent to customer</p>
            <input
              type="text"
              className="border w-full p-2 rounded-lg text-center tracking-widest text-lg"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
            />
            <Button className="w-full bg-green-600" onClick={verifyOtp}>
              Verify OTP
            </Button>

            {!canResend && otpTimer > 0 && (
              <p className="text-sm text-gray-600">Resend OTP in {otpTimer}s</p>
            )}

            {canResend && (
              <Button
                className="w-full text-blue-600"
                variant="outline"
                onClick={() => sendOtp("customer")}
              >
                🔁 Resend OTP
              </Button>
            )}
          </div>
        )}

        {/* Customer info after OTP verification */}
        {showCustomerForm && status !== "delivered" && (
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

            {!deliveryPhoto && (
              <Button className="w-full bg-blue-600" onClick={openCamera}>
                Open Camera
              </Button>
            )}

            {deliveryPhoto && (
              <img
                src={deliveryPhoto}
                className="mt-2 w-32 h-32 rounded border mx-auto"
              />
            )}

            {isCOD && (
              <div className="flex items-start gap-2 p-3 border rounded-lg bg-yellow-50">
                <input
                  type="checkbox"
                  id="cashReceived"
                  className="mt-1"
                  checked={cashReceived}
                  onChange={(e) => setCashReceived(e.target.checked)}
                />
                <label htmlFor="cashReceived" className="text-sm font-medium">
                  I confirm that I have received the full cash amount from the
                  customer.
                </label>
              </div>
            )}

            <Button
              className="w-full bg-green-700"
              onClick={submitCustomerInfo}
              disabled={isCOD && !cashReceived}
            >
              Submit & Complete Delivery
            </Button>
            {isCameraOpen && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <video
                    id="live-preview"
                    autoPlay
                    className="w-80 rounded"
                    ref={(video) => video && (video.srcObject = cameraStream)}
                  />
                  <div className="flex gap-3 mt-3">
                    <Button
                      className="bg-green-600 flex-1"
                      onClick={capturePhoto}
                    >
                      Capture
                    </Button>
                    <Button className="bg-red-600 flex-1" onClick={closeCamera}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
