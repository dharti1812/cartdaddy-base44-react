import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScannerView from "@/components/retailer/ScannerView";
import ImageUpload from "@/components/retailer/ImageUpload";

import {
  Wallet,
  Smartphone,
  CreditCard,
  Landmark,
  BadgeIndianRupee,
} from "lucide-react";
import {
  MapPin,
  Package,
  IndianRupee,
  Clock,
  Navigation as NavigationIcon,
  AlertCircle,
  Link as LinkIcon,
  XCircle,
} from "lucide-react";
import { Order, Retailer } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { calculateDeliveryCharges } from "../utils/deliveryChargeCalculator";
import { OrderApi } from "../utils/orderApi";
import toast from "react-hot-toast";
export default function AvailableOrders({
  orders: initialOrders,
  retailerId,
  config,
  onAccept,
  deliverySettings,
  retailerProfile,
  scrollToOrderId,
  clearScrollTarget,
  onScan,
  onClose,
}) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [accepting, setAccepting] = useState(null);
  const [showPaylinkDialog, setShowPaylinkDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [paylinkUrl, setPaylinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingPaymentConfirmation, setAwaitingPaymentConfirmation] =
    useState(false);

  const [paymentConfirmedOrder, setPaymentConfirmedOrder] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [imeiValue, setImeiValue] = useState("");
  const [imeiStep, setImeiStep] = useState("imei");
  const [imeiOrder, setImeiOrder] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scanAnimationRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);

  const [imeiAddedOrders, setImeiAddedOrders] = useState([]);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoURL, setVideoURL] = useState("");

  const [videoRecorded, setVideoRecorded] = useState(false);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [startCamera, setStartCamera] = useState(false);
  const videoRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const containerRef = useRef(null);
  const [highlightOrderId, setHighlightOrderId] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    setOrders(initialOrders || []);
  }, [initialOrders]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: 1280,
          height: 720,
        },
        audio: false,
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
          await OrderApi.acceptOrder({
            orderId: imeiOrder.code || imeiOrder.id,
            retailerId,
            notify_delivery_boys: true,
          });

          toast.success("Video saved successfully! Notifying delivery boy");

          if (videoRef.current?.srcObject) {
            videoRef.current.srcObject
              .getTracks()
              .forEach((track) => track.stop());
            videoRef.current.srcObject = null;
          }

          setRecording(false);

          setVideoRecorded(false);

          setShowImeiDialog(false);
          setImeiAddedOrders((prev) => [...prev, imeiOrder.id]);
          setImeiOrder(null);
          setImeiValue("");
          setImeiStep("imei");
          setAwaitingPaymentConfirmation(false);
          setPaymentConfirmedOrder(null);
          onAccept();
        } else {
          toast.error(res.message || "Failed to save video");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while saving video");
      }
    }
  };

  const openImeiDialog = (order) => {
    setImeiOrder(order);
    setShowImeiDialog(true);

    if (order.imei_number && order.imei_number.trim() !== "") {
      setImeiValue(order.imei_number);
      setImeiStep("video");
    } else {
      setImeiValue("");
      setImeiStep("imei");
    }
  };

  const handleScan = useCallback(
    (result) => {
      setIsActive(false);
      if (onScan) {
        onScan(result.value);
        return;
      }
      setScanResult(result);
      if (navigator.vibrate) navigator.vibrate(50);
    },
    [onScan],
  );

  const handleImageSelected = async (dataUrl) => {
    setIsActive(false);
    try {
      const img = new Image();
      img.onload = async () => {
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: [
              "qr_code",
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "code_93",
              "codabar",
              "itf",
              "data_matrix",
              "aztec",
              "pdf417",
            ],
          });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0) {
            const code = barcodes[0];
            handleScan({ value: code.rawValue, format: code.format });
          }
        }
      };
      img.src = dataUrl;
    } catch (err) {
      console.error("Image detection error:", err);
      setIsActive(true);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    if (onClose) onClose();
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

      setScannerActive(false);

      setImeiStep("video");
    } catch (err) {
      toast.error("Failed to save IMEI");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!scrollToOrderId) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`order-${scrollToOrderId}`);
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // highlight
      el.classList.add("ring-2", "ring-yellow-400");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-yellow-400");
      }, 2000);

      clearScrollTarget?.();
    });
  }, [scrollToOrderId, clearScrollTarget]);

  useEffect(() => {
    if (!scannerActive || !scanAttempted) return;

    const timeout = setTimeout(() => {
      toast.error("Unable to scan this IMEI. Please enter manually.");
      stopScanner();
    }, 6000);

    return () => clearTimeout(timeout);
  }, [scannerActive, scanAttempted]);

  const handleScanAgain = () => {
    setImeiValue("");
    setScannerActive(true);
    setScanAttempted(true);
  };

  const handleAccept = async (order) => {
    setAccepting(order.id);

    const acceptedRetailers = Array.isArray(order.accepted_retailers)
      ? order.accepted_retailers
      : [];

    const position =
      acceptedRetailers.length > 0 ? acceptedRetailers.length : 1;

    const deviceId = localStorage.getItem("cart_daddy_device_id") || "unknown";
    const deviceName = /mobile/i.test(navigator.userAgent)
      ? "Mobile Device"
      : /tablet/i.test(navigator.userAgent)
        ? "Tablet"
        : "Desktop/Laptop";

    const newAcceptance = {
      retailer_id: retailerId,
      device_id: deviceId,
      device_name: deviceName,
      position: position,
      accepted_at: new Date().toISOString(),
      status: "active",
    };

    const updatedAcceptances = [...acceptedRetailers, newAcceptance];

    const updateData = {
      accepted_retailers: updatedAcceptances,
      status: position === 1 ? "accepted_primary" : "accepted_backup",
      active_retailer_info:
        position === 1
          ? {
              retailer_id: retailerId,
              retailer_name: retailerProfile?.name || "Retailer",
              retailer_phone: retailerProfile?.phone || "",
              device_id: deviceId,
              device_name: deviceName,
              assigned_at: new Date().toISOString(),
            }
          : order.active_retailer_info,

      awaiting_delivery_boy: position === 1 ? true : false,
      delivery_boy_notification_sent: position === 1 ? true : false,
      delivery_boy_notified_at:
        position === 1 ? new Date().toISOString() : null,
    };

    if (position === 1) {
      updateData.active_retailer_id = retailerId;
    }

    const apiData = {
      orderId: order.code || order.id,
      retailerId: retailerId,
    };

    if (order.payment_type === "cash_on_delivery") {
      setScannerActive(false);
      setScanAttempted(false);
      setImeiValue("");
      setImeiOrder(order);
      setShowImeiDialog(true);
      setAwaitingPaymentConfirmation(false);
      setPaymentConfirmedOrder(null);
      onAccept();
      return;
    }
    if (order.payment_type === "needs_paylink") {
      await OrderApi.updateRetailerStatus(order.id, {
        status: "awaiting_payment_link",
        accepted_at: new Date().toISOString(),
      });
    }

    if (order.payment_type === "needs_paylink") {
      setPendingOrder(order);
      setAccepting(null);
      return;
    }

    await OrderApi.acceptOrder({
      ...apiData,
      notify_delivery_boys: true,
    });

    setAccepting(null);
    onAccept();
  };

  const paymentInfo = {
    cash_on_delivery: {
      label: "Cash on Delivery",
      icon: BadgeIndianRupee,
      className: "bg-green-50 text-green-700 border border-green-200",
      iconClass: "text-green-600",
    },
    needs_paylink: {
      label: "Payment Link Required",
      icon: LinkIcon,
      className: "bg-orange-50 text-orange-700 border border-orange-200",
      iconClass: "text-orange-600",
    },
    prepaid: {
      label: "Prepaid",
      icon: Wallet,
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      iconClass: "text-blue-600",
    },
    upi: {
      label: "UPI",
      icon: Smartphone,
      className: "bg-purple-50 text-purple-700 border border-purple-200",
      iconClass: "text-purple-600",
    },
    card: {
      label: "Card Payment",
      icon: CreditCard,
      className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      iconClass: "text-indigo-600",
    },
    phonepe: {
      label: "PhonePe",
      icon: Smartphone,
      className: "bg-violet-50 text-violet-700 border border-violet-200",
      iconClass: "text-violet-600",
    },
    google_pay: {
      label: "Google Pay",
      icon: Smartphone,
      className: "bg-red-50 text-red-700 border border-red-200",
      iconClass: "text-red-600",
    },
    paytm: {
      label: "Paytm",
      icon: Smartphone,
      className: "bg-cyan-50 text-cyan-700 border border-cyan-200",
      iconClass: "text-cyan-600",
    },
  };

  const fetchOrders = async () => {
    try {
      const allOrders = await OrderApi.PendingAcceptanceOrders();
      setOrders(allOrders?.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const handleSubmitPaylink = async () => {
    if (!paylinkUrl || !pendingOrder) return;

    setSubmitting(true);

    try {
      await OrderApi.SubmitPayLink({
        paylink_url: paylinkUrl,
        paylink_generated_at: new Date().toISOString(),
        payment_status: "paylink_sent",
        order_id: pendingOrder.id,
        status: "awaiting_payment_link",
      });

      const { notifyPaymentLink } =
        await import("../utils/customerNotifications");
      await notifyPaymentLink(pendingOrder, paylinkUrl);

      fetchOrders();

      setPaylinkUrl("");

      setPaymentConfirmedOrder(pendingOrder);
      setAwaitingPaymentConfirmation(true);

      setPendingOrder(null);
    } catch (err) {
      if (err.type === "validation" && err.errors) {
        Object.values(err.errors).forEach((messages) => {
          messages.forEach((msg) => {
            toast.error(msg);
          });
        });
      } else {
        toast.error(err.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentReceivedAndNotify = async (order) => {
    try {
      const result = await OrderApi.updateOrder(order.id, {
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      });

      toast.success("Payment confirmed. Please add IMEI.");

      setScannerActive(false);
      setScanAttempted(false);
      setImeiValue("");
      setImeiOrder(order);

      setShowImeiDialog(true);
      setAwaitingPaymentConfirmation(false);
      setPaymentConfirmedOrder(null);
      onAccept();
    } catch (err) {
      console.error("💥 Error in payment confirmation:", err);
      toast.error("Failed to confirm payment");
    }
  };

  const handleConfirmImeiAndNotify = async () => {
    if (!imeiOrder || submitting) return;

    setSubmitting(true);

    try {
      // await OrderApi.updateOrder(imeiOrder.id, {
      //   payment_status: "paid",
      //   paid_at: new Date().toISOString(),
      // });

      // ✅ Prepare FormData for IMEI + video
      const formData = new FormData();
      formData.append("imei", imeiValue);
      formData.append("order_id", imeiOrder.id);

      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        formData.append("video", blob, "packaging_video.webm");
      }

      const result = await OrderApi.storeImei(formData, true);

      if (!result.success) {
        toast.error(result.message || "Invalid IMEI");
        return;
      }

      await OrderApi.acceptOrder({
        orderId: imeiOrder.code || imeiOrder.id,
        retailerId,
        notify_delivery_boys: true,
      });

      toast.success("Order accepted & delivery boy assigned");

      stopScanner();
      setShowImeiDialog(false);
      setImeiAddedOrders((prev) => [...prev, imeiOrder.id]);

      setImeiValue("");
      setImeiOrder(null);
      setAwaitingPaymentConfirmation(false);
      setPaymentConfirmedOrder(null);

      onAccept();
    } catch (err) {
      toast.error(err.message || "Failed to complete order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!pendingOrder) return;

    setSubmitting(true);

    const penalties = pendingOrder.penalties || [];
    const penaltyAmount =
      (pendingOrder.amount * (config?.cancellation_penalty_percentage || 2)) /
      100;

    penalties.push({
      retailer_id: retailerId,
      reason: "Cancellation after acceptance",
      amount: penaltyAmount,
      percentage: config?.cancellation_penalty_percentage || 2,
      applied_at: new Date().toISOString(),
    });

    const updatedAcceptances = pendingOrder.accepted_retailers.map((ar) =>
      ar.retailer_id === retailerId ? { ...ar, status: "cancelled" } : ar,
    );

    const nextRetailer = updatedAcceptances.find(
      (ar) => ar.status === "active" && ar.retailer_id !== retailerId,
    );

    await Order.update(pendingOrder.id, {
      accepted_retailers: updatedAcceptances,
      active_retailer_id: nextRetailer?.retailer_id || null,
      active_retailer_info: nextRetailer || null,
      status: nextRetailer ? "accepted_primary" : "pending_acceptance",
      penalties,
    });

    await Retailer.update(retailerId, {
      current_orders: Math.max(0, (retailerProfile?.current_orders || 0) - 1),
      active_order_ids: (retailerProfile?.active_order_ids || []).filter(
        (id) => id !== pendingOrder.id,
      ),
    });

    setSubmitting(false);
    setShowPaylinkDialog(false);
    setShowCancelDialog(false);
    setPaylinkUrl("");
    setPendingOrder(null);
    onAccept();
  };

  const filteredOrders = orders.filter((order) => {
    const myAcceptance = order.accepted_retailers?.find(
      (ar) => ar.retailer_id === retailerId,
    );

    const myResponseStatus = myAcceptance?.response_status ?? "pending";

    const isUnpaid = order.payment_status === "unpaid";

    return (
      (myResponseStatus === "pending" && isUnpaid) ||
      (myResponseStatus === "awaiting_payment_link" && isUnpaid) ||
      order.status === "pending" ||
      order.status === "UNASSIGNED"
    );
  });

  if (filteredOrders.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Available Orders
          </h3>
          <p className="text-gray-500">
            {!retailerProfile?.accepts_cod
              ? "Enable COD in settings to receive cash orders"
              : "New orders will appear here. Check back soon!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
      @keyframes running-border {
        0% {
          border-image-source: linear-gradient(
            0deg,
            #6366f1,
            #8b5cf6,
            #ec4899,
            #6366f1
          );
        }
        100% {
          border-image-source: linear-gradient(
            360deg,
            #6366f1,
            #8b5cf6,
            #ec4899,
            #6366f1
          );
        }
      }

      .animate-running-border {
        border-image-slice: 1;
        animation: running-border 1.5s linear infinite;
      }
    `}</style>
      <div
        ref={containerRef}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
      >
        {filteredOrders.map((order) => {
          const amount = parseFloat(
            (order.amount || order.total_amount || "0")
              .toString()
              .replace(/,/g, ""),
          );

          let charges = null;

          const myAcceptance = order.accepted_retailers?.find(
            (ar) => ar.retailer_id === retailerId,
          );

          if (!deliverySettings) {
            console.warn("⚠️ Delivery settings not available");
          } else {
            charges = calculateDeliveryCharges(
              amount,
              myAcceptance.distance_km,
              deliverySettings,
            );
          }
          const acceptedCount = order.accepted_retailers?.length || 0;
          const maxAcceptances =
            order.max_acceptances || config?.max_retailer_acceptances || 3;
          const isCOD = order.is_cod || order.payment_method === "cod";
          const isQueued = order.status === "queued" || order.is_queued;

          const productCost = amount;

          const deliveryCharge = charges.baseCharge || 0;
          const fuelCost = charges.fuelCost || 0;

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

          const isPaymentReceived = order.payment_status === "paid";
          const isImeiAdded = !!order.imei_number;
          const isAccepted = !!order.accepted_at;

          const myResponseStatus = myAcceptance?.response_status ?? "pending";

          const is_COD = order.payment_type === "cash_on_delivery";
          const isUnpaid = order.payment_status === "unpaid";
          const showAcceptButton =
            myResponseStatus === "pending" && (is_COD || isUnpaid);
          const showPaymentReceivedButton =
            !is_COD && myResponseStatus === "awaiting_payment_link";

          return (
            <Card
              id={`order-${order.id}`}
              className={`border-none shadow-lg hover:shadow-xl transition-all duration-500
              ${highlightOrderId === order.id ? "ring-4 ring-red-500 animate-pulse" : ""}
              ${isQueued ? "border-2 border-amber-500" : ""}
            `}
            >
              <CardContent className="p-0">
                <div
                  className={`p-4 ${
                    isCOD
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50"
                      : isQueued
                        ? "bg-gradient-to-r from-amber-100 to-orange-100"
                        : "bg-gradient-to-r from-blue-50 to-purple-50"
                  } border-b`}
                >
                  {isQueued && (
                    <div className="mb-3 p-2 bg-amber-500 text-white rounded-lg flex items-center gap-2 text-sm font-semibold">
                      <Clock className="w-4 h-4 animate-pulse" />
                      QUEUED ORDER - Accept Now to Process!
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h5 className="font-bold text-gray-900 text-xs">
                      Order #{order.id} ({order.created_date})
                    </h5>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        {order.amount}
                      </Badge>
                      {isCOD && (
                        <Badge className="bg-amber-500 text-white border-0">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          COD
                        </Badge>
                      )}
                      {order.required_vehicle_type && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <NavigationIcon className="w-3 h-3 mr-1" />
                          {order.required_vehicle_type === "2_wheeler"
                            ? "2-Wheeler"
                            : "4-Wheeler"}
                        </Badge>
                      )}
                      {isQueued && (
                        <Badge className="bg-amber-600 text-white border-0 animate-pulse">
                          Queued #{order.queue_retry_count || 0}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        PRODUCT DETAILS
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                          >
                            <span className="text-gray-700 font-medium">
                              {item.name} x {item.quantity || 1}
                            </span>
                            <span className="font-bold text-gray-900">
                              ₹{order.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.payment_type === "needs_paylink" && (
                    <div className="grid grid-cols-12 gap-3 mt-3">
                      <Alert className="col-span-12 lg:col-span-9 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertCircle
                          className="w-4 h-4 text-amber-600 shrink-0 mt-[2px]"
                          style={{ marginTop: "-4px" }}
                        />
                        <AlertDescription className="text-amber-800 text-sm leading-relaxed">
                          <strong>Payment Link Required</strong> — Generate and
                          send a payment link to proceed.
                        </AlertDescription>
                      </Alert>

                      {order.offer_details && (
                        <div
                          className="col-span-12 lg:col-span-3 flex items-center justify-between gap-2 p-3 rounded-lg 
                   bg-green-100 border border-green-400 cursor-pointer 
                   hover:bg-green-200 transition-all duration-200"
                          onClick={() => setSelectedOffer(order.offer_details)}
                        >
                          <div className="text-green-900 font-semibold text-sm">
                            🎁 Offer{" "}
                            <span className="text-green-700 underline">
                              {order.offer_details.code}
                            </span>{" "}
                            Applied
                          </div>

                          <span className="text-xs text-green-700 font-medium whitespace-nowrap">
                            View Details→
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Delivery Earnings - Prominent Display */}
                  {charges.delivery_charge > 0 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
                      {/* <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-800 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Your Delivery Earnings:
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          ₹{charges.retailerEarning ?? 0}
                        </span>
                      </div> */}
                      <div className="text-xs text-green-700 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-medium">
                            {myAcceptance.distance_km} km
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
                          <span>To be paid to the Delivery Boy:</span>
                          <span className="font-medium">
                            -₹{charges.baseCharge}
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

                        {/* <div className="flex justify-between pt-1 border-t border-green-300 font-semibold">
                          <span>Total Delivery Charge:</span>
                          <span>₹{charges.delivery_charge}</span>
                        </div> */}
                        {/* <div className="flex justify-between text-green-900 pt-1">
                          <span>
                            Your Share ({charges.breakdown?.retailerPercent}%):
                          </span>
                          <span className="font-bold text-base">
                            ₹{charges.retailerEarning}
                          </span>
                        </div> */}
                        {/* <div className="flex justify-between text-blue-700 text-[10px]">
                          <span>
                            Delivery Boy will get (
                            {charges.breakdown?.deliveryBoyPercent}%):
                          </span>
                          <span className="font-medium">
                            ₹{charges.deliveryBoyEarning}
                          </span>
                        </div> */}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap mt-3">
                    {/* Posted Time */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Posted{" "}
                        {(() => {
                          const date = new Date(order.created_date);
                          const hours = date.getUTCHours();
                          const minutes = date.getUTCMinutes();
                          const ampm = hours >= 12 ? "pm" : "am";
                          const formattedHours =
                            hours % 12 === 0 ? 12 : hours % 12;
                          const formattedMinutes = minutes
                            .toString()
                            .padStart(2, "0");
                          return `${formattedHours}:${formattedMinutes} ${ampm}`;
                        })()}
                      </span>
                    </div>

                    {/* Distance */}
                    {myAcceptance.distance_km && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <NavigationIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {myAcceptance.distance_km} km away
                          </span>
                        </div>
                      </>
                    )}

                    {/* SLA */}
                    {order.sla_minutes && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-amber-600 font-medium">
                          ⏱️ ~{Math.ceil(myAcceptance.distance_km * 3)} min
                          travel time
                        </span>
                      </>
                    )}

                    {/* Payment Method */}
                    {paymentInfo[order.payment_type] && (
                      <>
                        <span className="text-gray-400">•</span>

                        <div
                          className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${
                            paymentInfo[order.payment_type].className
                          }`}
                        >
                          {React.createElement(
                            paymentInfo[order.payment_type].icon,
                            {
                              size: 16,
                              className:
                                paymentInfo[order.payment_type].iconClass,
                            },
                          )}

                          <span>{paymentInfo[order.payment_type].label}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* {acceptedCount > 0 && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-900 text-sm">
                        <strong>
                          {acceptedCount} seller{acceptedCount > 1 ? "s" : ""}{" "}
                          already accepted.
                        </strong>
                        {acceptedCount === 1 &&
                          " If they fail, you'll be next in line."}
                        {acceptedCount === 2 &&
                          " You'll be the backup if both fail."}
                      </AlertDescription>
                    </Alert>
                  )} */}

                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          DELIVERY ADDRESS
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {order.drop_address}
                        </p>

                        {myAcceptance.distance_km && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-blue-700 font-medium">
                              📍 {myAcceptance.distance_km} km from your
                              location
                            </span>
                            {order.sla_minutes && (
                              <span className="text-amber-700 font-medium">
                                ⏱️ ~{Math.ceil(myAcceptance.distance_km * 3)}{" "}
                                min travel time
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCOD && (
                    <div className="px-4">
                      <Alert className="bg-amber-50 border-amber-200">
                        <IndianRupee className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">
                          <strong>Cash on Delivery</strong> - Collect ₹
                          {order.amount} in cash from customer. Keep change
                          ready!
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {order.payment_type === "needs_paylink" && (
                    <>
                      {/* Payment Alert */}
                      {/* <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">
                          <strong>Payment Link Required</strong> — You must
                          generate and send a payment link to the customer to
                          proceed with this order.
                        </AlertDescription>
                      </Alert> */}

                      {/* Offer Details */}
                      {/* {order.offer_details && (
                        <div
                          className="p-3 rounded-md bg-green-100 border-2 border-green-400 cursor-pointer hover:bg-green-200 transition-colors"
                          onClick={() => setSelectedOffer(order.offer_details)}
                        >
                          <div className="font-semibold text-green-900 flex items-center justify-between">
                            <span>
                              🎁 Offer{" "}
                              <span className="text-sm text-green-700 underline">
                                {order.offer_details.code}
                              </span>{" "}
                              Applied
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              View Details →
                            </span>
                          </div>
                        </div>
                      )} */}
                    </>
                  )}

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {showAcceptButton && (
                      <Button
                        onClick={() => handleAccept(order)}
                        disabled={accepting === order.id}
                        className="w-full py-6 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl transition-all duration-300 hover:from-blue-700 hover:to-blue-800"
                      >
                        Accept Order
                      </Button>
                    )}

                    {showPaymentReceivedButton && (
                      <Button
                        onClick={async () =>
                          await handlePaymentReceivedAndNotify(order)
                        }
                        disabled={accepting === order.id}
                        className="relative w-full py-6 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 overflow-hidden rounded-xl transition-all duration-300"
                      >
                        {/* Animated border for payment received */}
                        {!imeiAddedOrders.includes(order.id) && (
                          <span className="absolute inset-0 rounded-xl border-2 border-green-400 animate-running-border" />
                        )}

                        {/* Button Text */}
                        <span className="relative z-10 flex items-center justify-center gap-2 font-semibold">
                          {imeiAddedOrders.includes(order.id) ? (
                            "Add IMEI"
                          ) : (
                            <>
                              <span className="text-lg animate-bounce">⚡</span>
                              Payment Received. Add IMEI
                            </>
                          )}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Link Dialog */}
      <Dialog
        open={!!pendingOrder}
        onOpenChange={(open) => {
          if (!open) setPendingOrder(null);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              🔒 Payment Link Required
            </DialogTitle>
            <DialogDescription>
              You must generate and submit payment link to proceed with this
              order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Generate payment link from your payment gateway and paste it
                here. Link will be automatically sent to customer.
              </AlertDescription>
            </Alert>

            {pendingOrder?.customer_payment_preference &&
              pendingOrder.customer_payment_preference.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Will be sent to customer via:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pendingOrder.customer_payment_preference.map(
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

            <div className="space-y-2">
              <Label htmlFor="paylink" className="text-sm font-semibold">
                Payment Link URL *
              </Label>
              <Input
                id="paylink"
                placeholder="https://razorpay.com/payment/..."
                value={paylinkUrl}
                onChange={(e) => setPaylinkUrl(e.target.value)}
                className="text-sm"
              />
            </div>

            {pendingOrder && (
              <div className="text-sm bg-gray-50 p-3 rounded-lg space-y-1">
                <p>
                  <strong>Customer:</strong> {pendingOrder.customer_name}
                </p>
                <p>
                  <strong>Contact:</strong>{" "}
                  {pendingOrder.customer_phone || "N/A"}
                </p>
                <p>
                  <strong>Amount:</strong> ₹
                  {new Intl.NumberFormat("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(pendingOrder.amount))}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  ⏱️ Timeout:{" "}
                  {pendingOrder.paylink_timeout_sec ||
                    config?.paylink_timeout_sec ||
                    150}{" "}
                  seconds
                </p>
              </div>
            )}

            <Alert className="bg-red-50 border-red-200">
              <XCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900 text-sm">
                <strong>Warning:</strong> Cancelling will result in{" "}
                {config?.cancellation_penalty_percentage || 2}% penalty (₹
                {pendingOrder
                  ? (
                      (pendingOrder.amount *
                        (config?.cancellation_penalty_percentage || 2)) /
                      100
                    ).toFixed(0)
                  : 0}
                )
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={submitting}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
            <Button
              onClick={handleSubmitPaylink}
              disabled={!paylinkUrl || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {submitting ? "Sending..." : "Send Payment Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-green-700 flex items-center gap-2">
              🎁 Offer Details
            </SheetTitle>
            <SheetDescription>
              Complete offer information and terms
            </SheetDescription>
          </SheetHeader>

          {selectedOffer && (
            <div className="mt-6 space-y-6">
              {/* Offer Code */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-4">
                <p className="text-xs text-green-600 font-semibold mb-1">
                  OFFER CODE
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {selectedOffer.code}
                </p>
              </div>

              {/* Bank Name */}
              {selectedOffer.bank_name && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    BANK
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Landmark className="w-6 h-6 text-blue-600" />
                    <p className="text-lg font-bold text-blue-900">
                      {selectedOffer.bank_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Title */}
              {selectedOffer.title && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    OFFER TITLE
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedOffer.title}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedOffer.description && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    DESCRIPTION
                  </p>

                  <div
                    className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200"
                    dangerouslySetInnerHTML={{
                      __html: selectedOffer.description,
                    }}
                  />
                </div>
              )}

              {/* Validity Period */}
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">
                  VALIDITY PERIOD
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs text-purple-600 mb-1">Valid From</p>
                    <p className="text-sm font-bold text-purple-900">
                      {selectedOffer.valid_from
                        ? new Date(selectedOffer.valid_from).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-orange-600 mb-1">Valid To</p>
                    <p className="text-sm font-bold text-orange-900">
                      {selectedOffer.valid_to
                        ? new Date(selectedOffer.valid_to).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <Badge
                    className={
                      selectedOffer.is_active
                        ? "bg-green-500 text-white"
                        : "bg-gray-400 text-white"
                    }
                  >
                    {selectedOffer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {selectedOffer.priority && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Priority</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedOffer.priority}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms Footer */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-6">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Note:</strong> Ensure customer is eligible for this
                  offer before proceeding with payment link generation.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              ⚠️ Are You Sure?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone and will result in a penalty
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-red-50 border-red-500 border-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <AlertDescription>
                <p className="font-bold text-red-900 text-lg mb-2">
                  Cancellation Penalty
                </p>
                <p className="text-red-800 text-2xl font-bold mb-2">
                  ₹
                  {pendingOrder
                    ? (
                        (pendingOrder.amount *
                          (config?.cancellation_penalty_percentage || 2)) /
                        100
                      ).toFixed(0)
                    : 0}
                </p>
                <p className="text-red-700 text-sm">
                  ({config?.cancellation_penalty_percentage || 2}% of order
                  value: ₹{pendingOrder?.amount})
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                • Penalty will be deducted from your next payout
                <br />
                • Order will be reassigned to next retailer in queue
                <br />• This affects your acceptance rate and rating
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={submitting}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Cancelling..." : "Yes, Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* IMEI Dialog */}
      <Dialog open={showImeiDialog} onOpenChange={setShowImeiDialog}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {imeiStep === "imei"
                ? "📱 Scan / Enter IMEI"
                : "🎥 Record Packaging Video"}
            </DialogTitle>
            <DialogDescription>
              {imeiStep === "imei"
                ? "Scan or manually enter the IMEI number"
                : "Record a sealed-box packaging video"}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1 — IMEI */}
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

              <Button
                variant="outline"
                disabled={showScanner}
                onClick={() => {
                  setIsActive(true);
                  setShowScanner(true);
                }}
              >
                📷 Scan IMEI
              </Button>
            </div>
          )}

          {/* STEP 2 — VIDEO */}
          {imeiStep === "video" && (
            <div className="space-y-4 py-4">
              <div className="relative w-full max-w-lg aspect-video bg-black rounded-md overflow-hidden">
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
                  🎬 Start
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStopRecording}
                  disabled={!recording}
                >
                  ⏹ Stop
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
                onClick={handleSaveImeiOnly}
              >
                Save IMEI
              </Button>
            ) : (
              <Button
                className="flex-1 bg-emerald-600"
                disabled={!videoRecorded}
                onClick={handleConfirmVideo}
              >
                Confirm & Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <ScannerView
                isActive={isActive}
                facingMode="environment" // Add this line
                onScan={(value) => {
                  const cleaned = value.replace(/\D/g, "").slice(0, 15);
                  setImeiValue(cleaned);
                  setIsActive(false);
                  setShowScanner(false);
                }}
                onClose={() => {
                  setIsActive(false);
                  setShowScanner(false);
                }}
              />

            <button
              onClick={() => {
                setIsActive(false);
                setShowScanner(false);
              }}
              className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
