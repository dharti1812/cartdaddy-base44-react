// (same imports as your file)
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  MapPin,
  Package,
  IndianRupee,
  Phone,
  Navigation as NavigationIcon,
  CheckCircle,
  Clock,
  CreditCard,
  AlertCircle,
  XCircle,
  Link as LinkIcon,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { Order } from "@/api/entities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import LocationTracker from "./LocationTracker";
import { API_BASE_URL } from "@/config";
import LiveTrackingMap from "../LiveTrackingMap";
import { calculateDeliveryCharges } from "../utils/deliveryChargeCalculator";
import toast from "react-hot-toast";
import { OrderApi } from "../utils/orderApi";

export default function ActiveDeliveries({
  orders,
  retailerId,
  config,
  onUpdate,
  retailerProfile,
  deliverySettings,
  onAssignDeliveryBoy,
  onHandoffDeliveryBoy,
}) {
  const [updating, setUpdating] = useState(null);
  const [showPaylinkDialog, setShowPaylinkDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paylinkUrl, setPaylinkUrl] = useState("");
  const [paylinkTimer, setPaylinkTimer] = useState(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const toNumber = (v) => Number((v || "0").toString().replace(/,/g, ""));
  const [otpInput, setOtpInput] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showVerifyOtpDialog, setShowVerifyOtpDialog] = useState(false);
  const [otpStatus, setOtpStatus] = useState({});
  const [highlightOrderId, setHighlightOrderId] = useState(null);
  const [rejectPreview, setRejectPreview] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [imeiStep, setImeiStep] = useState("imei"); // "imei" | "video"
  const [imeiValue, setImeiValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [imeiOrder, setImeiOrder] = useState(null);
  const videoRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [lockedUploads, setLockedUploads] = useState({
    imei: [],
    video: [],
  });

  const openImeiReuploadDialog = (item) => {
    setImeiOrder({
      id: item.order_id ?? item.code,
      item_id: item.id,
      type: "imei",
    });
    setImeiStep("imei");
    setImeiValue("");
    setVideoRecorded(false);
    setShowImeiDialog(true);
  };

  const openVideoReuploadDialog = (item) => {
    setImeiOrder({
      id: item.order_id ?? item.code,
      item_id: item.id,
      type: "video",
    });
    setImeiStep("video");
    setVideoRecorded(false);
    setShowImeiDialog(true);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: 1280,
          height: 720,
        },
        audio: true,
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start();

      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Cannot access camera");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    setRecording(false);
    setVideoRecorded(true);
  };

  const handleSaveImeiOnly = async () => {
    const imeiRegex = /^[38]\d{14}$/;

    if (!imeiOrder || !imeiRegex.test(imeiValue)) {
      toast.error("IMEI must be 15 digits and start with 3 or 8");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("order_id", imeiOrder.id);
      formData.append("imei", imeiValue);

      const res = await OrderApi.storeImei(formData);

      if (!res.success) {
        toast.error(res.message || "Invalid IMEI");
        return;
      }

      toast.success("IMEI saved successfully");
      setShowImeiDialog(false);
    } catch (err) {
      toast.error("Failed to save IMEI");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmVideo = async () => {
    if (!videoRef.current) return;

    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const formData = new FormData();

      formData.append("order_id", imeiOrder.id);
      formData.append("video", blob, "order_video.webm");

      try {
        const res = await OrderApi.storeVideo(formData, true);
        if (res.success) {
          toast.success("Video uploaded successfully!");

          if (videoRef.current?.srcObject) {
            videoRef.current.srcObject
              .getTracks()
              .forEach((track) => track.stop());
            videoRef.current.srcObject = null;
          }

          setRecording(false);
          setVideoRecorded(false);
          setShowImeiDialog(false);
        } else {
          toast.error(res.message || "Failed to save video");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while saving video");
      }
    }
  };

  const DELIVERY_TRACKING_LABELS = {
    accepted_db: "👤 Delivery Partner Onboarded",
    reached_to_seller: "📍 Reached Seller",
    authenticity_check: "🔍 Authenticity Check in Progress",
    verification_completed:
      "🛡️ Product Authenticity Verified at Seller Location",

    picked_up: "📦 Order Picked Up",
    out_for_delivery: "🛵 Out for Delivery",
    reached_to_customer: "📌 Reached Your Location",
    delivered: "✅ Delivered Successfully",
  };

  const DELIVERY_STEPS = [
    "assigned",
    "accepted_db",
    "reached_to_seller",
    "authenticity_check",
    "verification_completed",
    "picked_up",
    "out_for_delivery",
    "reached_to_customer",
    "delivered",
  ];

  const DELIVERY_TRACKING_STEPS_ORDERED = [
    "accepted_db",
    "reached_to_seller",
    "authenticity_check",
    "verification_completed",
    "picked_up",
    "out_for_delivery",
    "reached_to_customer",
    "delivered",
  ];

  const resolveCurrentDeliveryStep = (order) => {
    if (!order?.status_history) return "accepted_db";

    const completedSteps = Object.entries(order.status_history)
      .filter(([_, time]) => time)
      .sort((a, b) => new Date(a[1]) - new Date(b[1]));

    return completedSteps.length
      ? completedSteps[completedSteps.length - 1][0]
      : "accepted_db";
  };

  const shouldShowDeliveryTracking = (order) => {
    return (
      order?.delivery_status &&
      order?.status_history &&
      Object.keys(order.status_history).length > 0
    );
  };

  const getDeliveryStepState = (order, stepKey) => {
    const h = order?.status_history || {};

    if (h[stepKey]) return "done";

    if (
      stepKey === "reached_to_seller" &&
      h.accepted_db &&
      !h.reached_to_seller
    ) {
      return "current";
    }

    if (
      stepKey === "authenticity_check" &&
      h.reached_to_seller &&
      !h.authenticity_check
    ) {
      return "current";
    }

    if (
      stepKey === "verification_completed" &&
      h.authenticity_check &&
      !h.verification_completed
    ) {
      return "current";
    }

    if (stepKey === "picked_up" && h.verification_completed && !h.picked_up) {
      return "current";
    }

    if (stepKey === "out_for_delivery" && h.picked_up && !h.out_for_delivery) {
      return "current";
    }

    if (
      stepKey === "reached_to_customer" &&
      h.out_for_delivery &&
      !h.reached_to_customer
    ) {
      return "current";
    }

    if (stepKey === "delivered" && h.reached_to_customer && !h.delivered) {
      return "current";
    }

    return "upcoming";
  };

  const currentDeviceId = localStorage.getItem("cart_daddy_device_id");
  const currentDeliveryBoy = retailerProfile?.delivery_boys?.find(
    (db) => db.device_id === currentDeviceId && db.is_active,
  );

  useEffect(() => {
    orders.forEach((order) => {
      if (
        order.active_retailer_id === retailerId &&
        order.payment_status === "needs_paylink" &&
        !order.paylink_url
      ) {
        const myAcceptance = order.accepted_retailers?.find(
          (ar) => ar.retailer_id === retailerId,
        );
        if (myAcceptance) {
          const acceptedTime = new Date(myAcceptance.accepted_at).getTime();
          const now = Date.now();
          const elapsed = (now - acceptedTime) / 1000;
          const timeout =
            order.paylink_timeout_sec || config?.paylink_timeout_sec || 150;

          if (elapsed < timeout) {
            setPaylinkTimer(Math.ceil(timeout - elapsed));
          }
        }
      }
    });
  }, [orders, retailerId, config]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleGeneratePaylink = (order) => {
    setSelectedOrder(order);
    setShowPaylinkDialog(true);
    setPaylinkUrl("");
  };

  const handleSubmitPaylink = async () => {
    if (!paylinkUrl || !selectedOrder) return;

    setUpdating(selectedOrder.id);
    await Order.update(selectedOrder.id, {
      paylink_url: paylinkUrl,
      paylink_generated_at: new Date().toISOString(),
      payment_status: "paylink_sent",
    });

    const { notifyPaymentLink } =
      await import("../utils/customerNotifications");
    await notifyPaymentLink(selectedOrder, paylinkUrl);

    setUpdating(null);
    setShowPaylinkDialog(false);
    setPaylinkUrl("");
    setSelectedOrder(null);
    onUpdate();
  };

  const getFileUrl = (path) => {
    if (!path) return null;

    const parts = path.split("/");
    const fileName = parts.pop();
    const encodedFileName = encodeURIComponent(fileName);

    return `${API_BASE_URL}/public/${parts.join("/")}/${encodedFileName}`;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);

    const order = orders.find((o) => o.id === orderId);
    const deliveryBoy = order?.assigned_delivery_boy;
    const previousStatus = order?.status;

    await Order.update(orderId, { status: newStatus });

    if (deliveryBoy) {
      const { notifyCustomerOnStatusChange } =
        await import("../utils/customerNotifications");
      await notifyCustomerOnStatusChange(
        { ...order, status: newStatus },
        previousStatus,
        retailerProfile,
        deliveryBoy,
      );
    }

    setUpdating(null);
    onUpdate();
  };

  const handleResendOtp = async () => {
    if (!selectedOrder) {
      alert("No order selected to resend OTP");
      return;
    }

    setResending(true);
    try {
      const token = sessionStorage.getItem("token");
      const orderId = selectedOrder.id;
      const response = await fetch(
        `${API_BASE_URL}/api/retailer/orders/${orderId}/generate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        if (data.otp) {
          setOtp(data.otp);
        }

        setOtpStatus((prev) => ({ ...prev, [orderId]: "pending" }));

        setResendTimer(30);
      } else {
        alert(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err);
      alert("Failed to resend OTP. Check console.");
    } finally {
      setResending(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (
      !window.confirm(
        `Are you sure? You'll be charged $${
          config?.cancellation_penalty_percentage || 2
        }% (₹${(
          (order.total_amount *
            (config?.cancellation_penalty_percentage || 2)) /
          100
        ).toFixed(0)}) penalty.`,
      )
    ) {
      return;
    }

    setUpdating(order.id);

    const penalties = order.penalties || [];
    const penaltyAmount =
      (order.total_amount * (config?.cancellation_penalty_percentage || 2)) /
      100;

    penalties.push({
      retailer_id: retailerId,
      reason: "Cancellation after acceptance",
      amount: penaltyAmount,
      percentage: config?.cancellation_penalty_percentage || 2,
      applied_at: new Date().toISOString(),
    });

    const updatedAcceptances = order.accepted_retailers.map((ar) =>
      ar.retailer_id === retailerId ? { ...ar, status: "cancelled" } : ar,
    );

    const nextRetailer = updatedAcceptances.find(
      (ar) => ar.status === "active" && ar.retailer_id !== retailerId,
    );

    await Order.update(order.id, {
      accepted_retailers: updatedAcceptances,
      active_retailer_id: nextRetailer?.retailer_id || null,
      status: nextRetailer ? "accepted_primary" : "pending_acceptance",
      penalties,
    });

    setUpdating(null);
    onUpdate();
  };

  const openNavigation = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`;
    window.open(url, "_blank");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "accepted":
        return "bg-green-500 text-white";
      case "en_route":
        return "bg-blue-500 text-white";
      case "delivered":
        return "bg-green-700 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      case "rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleGenerateOtp = async (order) => {
    const token = sessionStorage.getItem("token");
    const orderId = order.id;
    setSelectedOrder(order);
    setShowOtpDialog(true);
    setOtp(null);

    try {
      setOtpSending(true);

      const response = await fetch(
        `${API_BASE_URL}/api/retailer/orders/${orderId}/generate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        setOtp(data.otp);
        setOtpStatus((prev) => ({ ...prev, [order.id]: "pending" }));

        setResendTimer(30);
      } else {
        alert(data.message || "Failed to generate OTP");
        setShowOtpDialog(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setShowOtpDialog(false);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (orderId, enteredOtp) => {
    const token = sessionStorage.getItem("token");
    if (!orderId || !enteredOtp) return;

    try {
      setVerifyingOtp(true);
      const response = await fetch(
        `${API_BASE_URL}/api/retailer/orders/${orderId}/confirm-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp: enteredOtp }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        alert("✅ OTP verified! Pickup confirmed.");
        setOtpStatus((prev) => ({ ...prev, [orderId]: "verified" }));
        setShowVerifyOtpDialog(false);
        onUpdate();
      } else {
        alert(data.message || "❌ Invalid OTP");
        setOtpStatus((prev) => ({ ...prev, [orderId]: "pending" }));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <>
      {currentDeliveryBoy && (
        <LocationTracker
          deliveryBoyId={currentDeliveryBoy.id}
          retailerId={retailerId}
          retailerProfile={retailerProfile}
        />
      )}

      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Active Orders
              </h3>
              <p className="text-gray-500">
                Orders you accept will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const currentStep = resolveCurrentDeliveryStep(order);
            const currentIndex =
              DELIVERY_TRACKING_STEPS_ORDERED.indexOf(currentStep);
            const nextStep =
              DELIVERY_TRACKING_STEPS_ORDERED[currentIndex + 1] || "COMPLETED";

            const myAcceptance = order.accepted_retailers?.find(
              (ar) => ar.retailer_id === retailerId,
            );
            const isPrimary = order.active_retailer_id === retailerId;
            const isMyDelivery =
              order.delivery_boy?.code === currentDeliveryBoy?.id;
            const position = myAcceptance?.position;

            let charges = null;

            if (!deliverySettings) {
              console.warn("⚠️ Delivery settings not available");
            } else {
              charges = calculateDeliveryCharges(
                order.amount,
                order.distance_km,
                deliverySettings,
              );
            }

            const productCost = order.amount;

            const deliveryCharge = charges?.baseCharge || 0;
            const fuelCost = charges?.fuelCost || 0;

            const commissionItem = order.items?.find(
              (item) =>
                item.commission_type === "percent" ||
                item.commission_type === "fixed",
            );

            let platformFeeAmount = 0;
            let platformFeeLabel = "";

            if (commissionItem) {
              if (commissionItem.commission_type === "percent") {
                platformFeeAmount =
                  (productCost * commissionItem.commission_value) / 100;
                platformFeeLabel = `Platform Fee`;
              } else if (commissionItem.commission_type === "fixed") {
                platformFeeAmount = commissionItem.commission_value;
                platformFeeLabel = `Platform Fee`;
              }
            }

            const settlementAmount =
              productCost - platformFeeAmount - deliveryCharge - fuelCost;
            const roundedSettlementAmount = Math.round(settlementAmount);

            return (
              <Card
                key={order.id}
                id={`active-order-${order.id}`}
                className={`border-2 transition-all duration-500
    ${
      highlightOrderId === order.id
        ? "ring-4 ring-red-500 animate-pulse scale-[1.01]"
        : ""
    }
    ${isPrimary ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50"}
  `}
              >
                <CardContent className="p-4">
                  {/* ---------- header & badges ---------- */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-xs text-gray-900">
                          Order #{order.id} ({order.created_date})
                        </h3>
                        <Badge
                          className={getStatusBadgeClass(order.delivery_status)}
                        >
                          {(order.delivery_status || "unknown").replace(
                            /_/g,
                            " ",
                          )}
                        </Badge>
                        {isPrimary && (
                          <Badge className="bg-green-600 text-white">
                            PRIMARY
                          </Badge>
                        )}
                        {/* {!isPrimary && position && (
                          <Badge className="bg-blue-600 text-white">
                            BACKUP #{position}
                          </Badge>
                        )} */}
                      </div>

                      {/* product details */}
                      {order.items && order.items.length > 0 && (
                        <div className="pt-3 border-t mt-3 mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            PRODUCT DETAILS
                          </p>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 p-3 rounded space-y-3"
                              >
                                {/* Product name & price */}
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700 font-medium">
                                    {item.name}
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    ₹{item.price}
                                  </span>
                                </div>

                                {/* Verification Section */}

                                <div className="space-y-2">
                                  {/* IMEI Status */}
                                  <div className="bg-white rounded-lg border px-4 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-700">
                                        IMEI Verification
                                      </p>

                                      {item.imei_verified === 1 ? (
                                        <Badge className="bg-emerald-600 text-white">
                                          Verified
                                        </Badge>
                                      ) : item.imei_upload_count >= 2 ? (
                                        <Badge className="bg-blue-600 text-white">
                                          Uploaded
                                        </Badge>
                                      ) : item.imei_reject_count > 0 ? (
                                        <Badge className="bg-red-500 text-white">
                                          Rejected
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-500 text-white">
                                          Pending
                                        </Badge>
                                      )}
                                    </div>

                                    {item.imei_reject_count > 0 &&
                                      item.imei_verified !== 1 &&
                                      item.imei_upload_count < 2 && (
                                        <div className="flex items-center justify-between pt-2 border-t">
                                          <button
                                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                                            onClick={() =>
                                              setRejectPreview({
                                                open: true,
                                                type: "imei",
                                                rejections:
                                                  item.imei_rejections,
                                              })
                                            }
                                          >
                                            View rejection reason
                                          </button>

                                          <span
                                            onClick={() =>
                                              openImeiReuploadDialog(item)
                                            }
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                                          >
                                            Re-upload IMEI
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Video Status */}

                                  <div className="bg-white rounded-lg border px-4 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">
                                        Packaging Video
                                      </span>

                                      {item.video_verified === 1 ? (
                                        <Badge className="bg-emerald-600 text-white">
                                          Verified
                                        </Badge>
                                      ) : item.video_upload_count >= 2 ? (
                                        <Badge className="bg-blue-600 text-white">
                                          Uploaded
                                        </Badge>
                                      ) : item.video_reject_count > 0 ? (
                                        <Badge className="bg-red-500 text-white">
                                          Rejected
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-500 text-white">
                                          Pending
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    {item.video_reject_count > 0 &&
                                      item.video_verified !== 1 &&
                                      item.video_upload_count < 2 && (
                                        <div className="flex items-center justify-between pt-2 border-t">
                                          <button
                                            type="button"
                                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                                            onClick={() =>
                                              setRejectPreview({
                                                open: true,
                                                type: "video",
                                                rejections:
                                                  item.video_rejections,
                                              })
                                            }
                                          >
                                            View rejection reason
                                          </button>

                                          <span
                                            onClick={() =>
                                              openVideoReuploadDialog(item)
                                            }
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                                          >
                                            Re-upload video
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* customer + address + distance */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <UserIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {order.customer_name}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">
                            {order.customer_masked_contact}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4" />
                          <span>{order.drop_address}</span>
                        </div>

                        {order.distance_km && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <NavigationIcon className="w-4 h-4" />
                            <span>{order.distance_km} km</span>
                          </div>
                        )}

                        {/* Settlement info */}
                        {/* <div className="mt-3 p-3 bg-white border-2 border-amber-300 rounded-lg">
                          <p className="text-xs font-bold text-amber-900 mb-2">
                            💰 Settlement Information
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Order Value:
                              </span>
                              <span className="font-bold text-gray-900">
                                ₹{order.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Delivery Charges:
                              </span>
                              <span className="font-bold text-red-700">
                                - ₹{order.delivery_charge || 0}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t-2 border-amber-200">
                              <span className="font-bold text-gray-900">
                                Your Net Settlement:
                              </span>
                              <span className="font-bold text-green-700">
                                ₹
                                {order.seller_net_payable ??
                                  toNumber(order.amount) - toNumber(order.delivery_charge)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 italic">
                              ℹ️ Delivery charges deducted from your settlement
                              & paid to delivery boy
                            </p>
                          </div>
                        </div> */}
                        {/* Settlement info */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
                          <div className="text-xs text-green-700 space-y-1">
                            <div className="flex justify-between">
                              <span>Distance:</span>
                              <span className="font-medium">
                                {order.distance_km} km
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>
                                Fuel Cost (₹
                                {deliverySettings?.fuel_cost_per_km || 5}/km):
                              </span>
                              <span className="font-medium">
                                ₹{Math.round(charges.fuelCost)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>Delivery Charges:</span>
                              <span className="font-medium">
                                ₹{charges.baseCharge}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>{platformFeeLabel}</span>
                              <span className="font-semibold text-red-600">
                                -₹{platformFeeAmount}
                              </span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-green-300 font-bold text-sm">
                              <span className="text-green-900">
                                Settlement Amount
                              </span>
                              <span className="text-emerald-700">
                                ₹{roundedSettlementAmount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* location tracker banner */}
                  {isMyDelivery && (
                    <div className="mt-3">
                      <Alert className="bg-blue-50 border-blue-500">
                        <NavigationIcon className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-900 font-semibold">
                          📱 YOU ARE DELIVERING THIS ORDER - Location tracking
                          is active
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* {!isPrimary && (
                    <Alert className="bg-amber-50 border-amber-200 mt-3">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-900">
                        <strong>You're #{position} in line.</strong> Another
                        seller is currently handling this order. You'll be
                        activated if they fail.
                      </AlertDescription>
                    </Alert>
                  )} */}

                  {isPrimary &&
                    order.payment_status === "needs_paylink" &&
                    !order.paylink_url &&
                    paylinkTimer && (
                      <Alert className="bg-red-50 border-red-200 mt-3">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-900 text-sm">
                          <strong className="text-lg">
                            ⏰ {paylinkTimer}s remaining
                          </strong>{" "}
                          to generate payment link or order will be reassigned!
                        </AlertDescription>
                      </Alert>
                    )}

                  {/* Delivery address details section */}
                  <div className="pt-3 border-t mt-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          DELIVERY ADDRESS
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {order.drop_address}
                        </p>

                        {order.distance_km && (
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <NavigationIcon className="w-3 h-3" />
                            <span className="font-medium">
                              {order.distance_km} km from your location
                            </span>
                          </div>
                        )}
                      </div>

                      {isPrimary && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="flex-shrink-0 border-blue-300 hover:bg-blue-100"
                          onClick={() => openNavigation(order.drop_address)}
                        >
                          <NavigationIcon className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* DELIVERY BOY WHO ACCEPTED ORDER */}
                  {order.assign_delivery_boy_id &&
                    order.delivery_status !== "pendig" &&
                    order.delivery_status !== "accepted" && (
                      <div className="mt-4 bg-green-50 border-2 border-green-400 rounded-xl p-4 w-full shadow-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-green-200 pb-2 mb-3">
                          <p className="text-sm font-semibold text-green-900 flex items-center gap-2">
                            🚴‍♂️ Delivery Boy Details
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 text-white text-[10px] px-2 py-[2px] rounded-full">
                              Accepted
                            </Badge>
                            {order.items?.[0]?.delivery_boy_accepted_at && (
                              <span className="text-[11px] text-gray-600 italic">
                                {new Date(
                                  order.items[0].delivery_boy_accepted_at,
                                ).toLocaleString()}
                              </span>
                            )}

                            {(order.delivery_status === "reached_to_seller" ||
                              order.delivery_status === "accepted_db") && (
                              <>
                                <Button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOtpInput("");
                                    setShowVerifyOtpDialog(true);
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white py-3 mt-2 text-xs"
                                >
                                  Verify OTP
                                </Button>
                              </>
                            )}

                            {order.delivery_status === "out_for_delivery" && (
                              <Badge className="bg-green-600 text-white px-3 py-1 text-xs">
                                OTP Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          <LiveTrackingMap orderId={order.id} />
                        </div>

                        {/* Profile Section */}
                        <div className="flex items-center gap-4">
                          <img
                            src={order.assign_delivery_boy_photo}
                            alt={order.assign_delivery_boy_name}
                            className="w-14 h-14 rounded-full border-2 border-green-400 object-cover shadow-md"
                          />
                          <div className="flex flex-col">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {order.assign_delivery_boy_name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {/* <span className="text-xs text-gray-700">
                                {order.assign_delivery_boy_phone}
                              </span> */}

                              <a
                                href={`tel:${order.assign_delivery_boy_phone}`}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded
             border border-green-600 text-green-700
             hover:bg-green-50 hover:text-green-800
             transition"
                                aria-label="Call delivery partner"
                              >
                                <Phone className="w-3 h-3" />
                                Call
                              </a>
                            </div>

                            {order.delivery_boy_vehicle_no && (
                              <p className="text-[11px] text-gray-500">
                                Vehicle No: {order.delivery_boy_vehicle_no}
                              </p>
                            )}
                          </div>
                        </div>

                        {shouldShowDeliveryTracking(order) && (
                          <div className="mt-5 bg-white border rounded-xl p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">
                              Delivery Progress
                            </h4>

                            <div className="relative">
                              {/* Background line */}
                              <div className="absolute top-2 left-0 right-0 h-1 bg-gray-200 rounded-full" />

                              {/* Dots container */}
                              <div className="flex justify-between relative z-10">
                                {DELIVERY_TRACKING_STEPS_ORDERED.map(
                                  (stepKey, index) => {
                                    const stepState = getDeliveryStepState(
                                      order,
                                      stepKey,
                                    );

                                    const timestamp =
                                      order.status_history?.[stepKey];

                                    return (
                                      <div
                                        key={stepKey}
                                        className="flex flex-col items-center"
                                      >
                                        {/* Dot */}
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${
                    stepState === "done"
                      ? "bg-green-600 border-green-600"
                      : stepState === "current"
                        ? "bg-white border-blue-600 animate-delivery-blue"
                        : "bg-white border-gray-300"
                  }`}
                                        >
                                          {stepState === "done" && (
                                            <CheckCircle className="w-3 h-3 text-white" />
                                          )}
                                        </div>

                                        {/* Label */}
                                        <span
                                          className={`mt-2 text-[10px] font-medium text-center
                  ${
                    stepState === "done"
                      ? "text-green-700"
                      : stepState === "current"
                        ? "text-blue-700 font-semibold"
                        : "text-gray-500"
                  }`}
                                        >
                                          {DELIVERY_TRACKING_LABELS[stepKey]}
                                        </span>

                                        {/* Timestamp */}
                                        {timestamp && (
                                          <span className="mt-1 text-[9px] text-gray-400 text-center">
                                            {new Date(timestamp).toLocaleString(
                                              "en-IN",
                                              {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                              },
                                            )}
                                          </span>
                                        )}

                                        {/* Delivered photo */}
                                        {stepKey === "delivered" &&
                                          order.items[0]
                                            ?.delivery_verified_photo_url && (
                                            <>
                                              <img
                                                src={
                                                  order.items[0]
                                                    .delivery_verified_photo_url
                                                }
                                                alt="Delivery Verified"
                                                className="w-10 h-10 rounded-full object-cover border mt-2"
                                              />
                                              <span className="text-[10px] font-semibold text-gray-700">
                                                {order.customer_name}
                                              </span>
                                            </>
                                          )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {isPrimary &&
                    order.payment_status === "needs_paylink" &&
                    !order.paylink_url && (
                      <Button
                        onClick={() => handleGeneratePaylink(order)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 mt-3"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Generate Payment Link ({paylinkTimer}s remaining)
                      </Button>
                    )}

                  {isPrimary &&
                    ["paid", "paylink_sent"].includes(order.payment_status) && (
                      <div className="grid grid-cols-2 gap-3 pt-2 mt-3">
                        <Button variant="outline" className="w-full" disabled>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Customer
                        </Button>
                        <Button
                          onClick={() =>
                            handleStatusUpdate(order.id, "en_route")
                          }
                          disabled={updating === order.id}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        >
                          {updating === order.id
                            ? "Updating..."
                            : "Start Delivery"}
                        </Button>
                      </div>
                    )}

                  {myAcceptance?.status === "active" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelOrder(order)}
                      disabled={updating === order.id}
                      className="w-full mt-3"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Order (
                      {config?.cancellation_penalty_percentage || 2}% Penalty: ₹
                      {(
                        (order.total_amount *
                          (config?.cancellation_penalty_percentage || 2)) /
                        100
                      ).toFixed(0)}
                      )
                    </Button>
                  )}

                  {isPrimary && order.delivery_boy && (
                    <div className="pt-4 mt-3">
                      <div className="bg-green-50 border-2 border-green-500 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-green-900 mb-1">
                          ASSIGNED TO
                        </p>
                        <p className="font-bold text-gray-900">
                          {order.delivery_boy.name}
                        </p>
                        <p className="text-sm text-gray-700">
                          {order.delivery_boy.phone}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onHandoffDeliveryBoy(order)}
                        className="w-full mt-2"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Change Delivery Boy
                      </Button>
                    </div>
                  )}

                  {isPrimary && !order.delivery_boy && (
                    <div className="pt-4 mt-3">
                      <Button
                        onClick={() => onAssignDeliveryBoy(order)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Assign Delivery Boy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* VERIFY OTP DIALOG */}
      <Dialog open={showVerifyOtpDialog} onOpenChange={setShowVerifyOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Pickup OTP</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 mb-3">
              Enter the OTP provided by the delivery boy:
            </p>

            <Input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP"
            />

            {/* 🔥 Resend OTP UI */}
            <div className="flex justify-end mt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-gray-500">
                  Resend OTP in {resendTimer}s
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-blue-600 text-sm underline disabled:text-gray-400"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerifyOtpDialog(false)}
              disabled={verifyingOtp}
            >
              Cancel
            </Button>

            <Button
              onClick={() => handleVerifyOtp(selectedOrder?.id, otpInput)}
              disabled={otpInput.length !== 6 || verifyingOtp}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP DISPLAY DIALOG */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pickup OTP</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-3">
              OTP will be sent to the delivery boy. Delivery boy must enter it
              to confirm pickup.
            </p>
            {otp && (
              <div className="text-center bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-lg font-bold text-green-800">OTP: {otp}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOtpDialog(false)}
              disabled={otpSending}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAYLINK DIALOG (unchanged) */}
      <Dialog open={showPaylinkDialog} onOpenChange={setShowPaylinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payment Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Generate payment link from your payment gateway and paste it
                here. Link will be automatically sent to customer via their
                preferred channels.
              </AlertDescription>
            </Alert>
            {selectedOrder?.customer_payment_preference &&
              selectedOrder.customer_payment_preference.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Send to customer via:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.customer_payment_preference.map(
                      (channel, idx) => (
                        <Badge
                          key={idx}
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          {channel.toUpperCase()}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
            <div>
              <Label htmlFor="paylink">Payment Link URL</Label>
              <Input
                id="paylink"
                placeholder="https://razorpay.com/payment/..."
                value={paylinkUrl}
                onChange={(e) => setPaylinkUrl(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Customer: <strong>{selectedOrder?.customer_name}</strong>
              </p>
              <p>
                Amount: <strong>₹{selectedOrder?.total_amount}</strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaylinkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPaylink}
              disabled={!paylinkUrl || updating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {updating ? "Sending..." : "Send Payment Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectPreview?.open}
        onOpenChange={() => setRejectPreview(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {rejectPreview?.type === "imei"
                ? "IMEI Rejection Details"
                : "Packaging Video Rejection"}
            </DialogTitle>
          </DialogHeader>

          {/* No Rejections */}
          {(!rejectPreview?.rejections ||
            rejectPreview.rejections.length === 0) && (
            <p className="text-sm text-gray-500">
              No rejection details available.
            </p>
          )}

          {/* Rejection List */}
          <div className="space-y-4 mt-3 max-h-[65vh] overflow-y-auto">
            {rejectPreview?.rejections
              ?.slice()
              .reverse()
              .map((rej, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-2">
                    Rejected on {rej.created_at}
                  </p>

                  {/* Reason */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-gray-800 bg-white p-3 rounded border">
                      {rej.reason || "No reason provided"}
                    </p>
                  </div>

                  {/* Photo */}
                  {rej.photo_path && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Evidence Photo
                      </p>
                      <img
                        src={`${API_BASE_URL}/${encodeURI(rej.photo_path)}`}
                        className="w-full h-48 object-cover rounded border cursor-zoom-in"
                        onClick={() =>
                          setZoomPhoto(
                            `${API_BASE_URL}/${encodeURI(rej.photo_path)}`,
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Video */}
                  {rej.video_path && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Evidence Video
                      </p>
                      <video
                        controls
                        className="w-full h-56 rounded bg-black"
                        src={`${API_BASE_URL}/${encodeURI(rej.video_path)}`}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRejectPreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black">
          <img
            src={zoomPhoto}
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showImeiDialog} onOpenChange={setShowImeiDialog}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {imeiStep === "imei"
                ? "Scan / Enter IMEI"
                : "Record Packaging Video"}
            </DialogTitle>
            <DialogDescription>
              {imeiStep === "imei"
                ? "Scan or manually enter the IMEI number"
                : "Record a sealed-box packaging video"}
            </DialogDescription>
          </DialogHeader>

          {/* IMEI STEP */}
          {imeiStep === "imei" && (
            <div className="space-y-4 py-4">
              <Label>IMEI Number</Label>
              <Input
                placeholder="Enter IMEI"
                maxLength={15}
                value={imeiValue}
                onChange={(e) =>
                  setImeiValue(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          )}

          {/* VIDEO STEP */}
          {imeiStep === "video" && (
            <div className="space-y-4 py-4">
              <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleStartRecording}
                  disabled={recording}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStopRecording}
                  disabled={!recording}
                >
                  Stop
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowImeiDialog(false);
                setImeiOrder(null);
                setImeiValue("");
                setImeiStep("imei");
                setVideoRecorded(false);
              }}
            >
              Cancel
            </Button>

            {imeiStep === "imei" ? (
              <Button
                className="flex-1"
                disabled={imeiValue.length !== 15 || submitting}
                onClick={() => handleSaveImeiOnly(imeiOrder)}
              >
                Save IMEI
              </Button>
            ) : (
              <Button
                className="flex-1 bg-emerald-600"
                disabled={!videoRecorded}
                onClick={() => handleConfirmVideo(imeiOrder)}
              >
                Confirm & Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
