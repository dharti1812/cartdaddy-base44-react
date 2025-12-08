import React, { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";

// New import for LocationTracker
import LocationTracker from "./LocationTracker";
import { API_BASE_URL } from "@/config";
import LiveTrackingMap from "../LiveTrackingMap";

export default function ActiveDeliveries({
  orders,
  retailerId,
  config,
  onUpdate,
  retailerProfile,
  onAssignDeliveryBoy,
  onHandoffDeliveryBoy,
}) {
  const [updating, setUpdating] = useState(null);
  const [showPaylinkDialog, setShowPaylinkDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paylinkUrl, setPaylinkUrl] = useState("");
  const [paylinkTimer, setPaylinkTimer] = useState(null);
  const toNumber = (v) => Number((v || "0").toString().replace(/,/g, ""));

  // Get current delivery boy if logged in
  const currentDeviceId = localStorage.getItem("cart_daddy_device_id");
  const currentDeliveryBoy = retailerProfile?.delivery_boys?.find(
    (db) => db.device_id === currentDeviceId && db.is_active
  );

  useEffect(() => {
    orders.forEach((order) => {
      if (
        order.active_retailer_id === retailerId &&
        order.payment_status === "needs_paylink" &&
        !order.paylink_url
      ) {
        const myAcceptance = order.accepted_retailers?.find(
          (ar) => ar.retailer_id === retailerId
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

    // Send payment link notification
    const { notifyPaymentLink } = await import(
      "../utils/customerNotifications"
    );
    await notifyPaymentLink(selectedOrder, paylinkUrl);

    setUpdating(null);
    setShowPaylinkDialog(false);
    setPaylinkUrl("");
    setSelectedOrder(null);
    onUpdate();
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);

    const order = orders.find((o) => o.id === orderId);
    const deliveryBoy = order?.assigned_delivery_boy;
    const previousStatus = order?.status;

    await Order.update(orderId, { status: newStatus });

    // Send customer notification
    if (deliveryBoy) {
      const { notifyCustomerOnStatusChange } = await import(
        "../utils/customerNotifications"
      );
      await notifyCustomerOnStatusChange(
        { ...order, status: newStatus },
        previousStatus,
        retailerProfile,
        deliveryBoy
      );
    }

    setUpdating(null);
    onUpdate();
  };

  const handleCancelOrder = async (order) => {
    if (
      !window.confirm(
        `Are you sure? You'll be charged ${
          config?.cancellation_penalty_percentage || 2
        }% (₹${(
          (order.total_amount *
            (config?.cancellation_penalty_percentage || 2)) /
          100
        ).toFixed(0)}) penalty.`
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

    // Update this retailer's acceptance status
    const updatedAcceptances = order.accepted_retailers.map((ar) =>
      ar.retailer_id === retailerId ? { ...ar, status: "cancelled" } : ar
    );

    // Find next retailer in line
    const nextRetailer = updatedAcceptances.find(
      (ar) => ar.status === "active" && ar.retailer_id !== retailerId
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

  // Helper function for status badges
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
  console.log("🧾 Orders Data:", orders);

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
            const myAcceptance = order.accepted_retailers?.find(
              (ar) => ar.retailer_id === retailerId
            );
            const isPrimary = order.active_retailer_id === retailerId;
            const isMyDelivery =
              order.delivery_boy?.code === currentDeliveryBoy?.id;
            const position = myAcceptance?.position;

            return (
              <Card
                key={order.id}
                className={`border-2 ${
                  isPrimary
                    ? "border-green-500 bg-green-50"
                    : "border-blue-500 bg-blue-50"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          {order.id}
                        </h3>
                        <Badge
                          className={getStatusBadgeClass(order.delivery_status)}
                        >
                          {(order.delivery_status || "unknown").replace(
                            /_/g,
                            " "
                          )}
                        </Badge>
                        {isPrimary && (
                          <Badge className="bg-green-600 text-white">
                            PRIMARY
                          </Badge>
                        )}
                        {!isPrimary && position && (
                          <Badge className="bg-blue-600 text-white">
                            BACKUP #{position}
                          </Badge>
                        )}
                      </div>

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

                        {/* NEW: Settlement Information */}
                        <div className="mt-3 p-3 bg-white border-2 border-amber-300 rounded-lg">
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
                                  toNumber(order.amount) -
                                    toNumber(order.delivery_charge)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 italic">
                              ℹ️ Delivery charges deducted from your settlement
                              & paid to delivery boy
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {!isPrimary && (
                    <Alert className="bg-amber-50 border-amber-200 mt-3">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-900">
                        <strong>You're #{position} in line.</strong> Another
                        seller is currently handling this order. You'll be
                        activated if they fail.
                      </AlertDescription>
                    </Alert>
                  )}

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
                  {order.assign_delivery_boy_id && (
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
                                order.items[0].delivery_boy_accepted_at
                              ).toLocaleString()}
                            </span>
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
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-600" />{" "}
                            {order.assign_delivery_boy_phone}
                          </p>
                          {order.delivery_boy_vehicle_no && (
                            <p className="text-[11px] text-gray-500">
                              Vehicle No: {order.delivery_boy_vehicle_no}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isPrimary &&
                    order.payment_status === "needs_paylink" &&
                    !order.paylink_url && (
                      <Button
                        onClick={() => handleGeneratePaylink(order)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 mt-3"
                      >
                        <LinkIcon className="w-5 h-5 mr-2" />
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

                  {order.items && order.items.length > 0 && (
                    <div className="pt-3 border-t mt-3">
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
                              {item.name}
                            </span>
                            <span className="font-bold text-gray-900">
                              ₹{item.price}
                            </span>
                          </div>
                        ))}
                      </div>
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
                      )
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
    </>
  );
}
