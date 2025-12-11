import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Smartphone, CreditCard, Landmark, BadgeIndianRupee } from "lucide-react";
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
import { calculateDeliveryCharges } from "../utils/deliveryChargeCalculator";
import { OrderApi } from "../utils/orderApi";
import { API_BASE_URL } from "@/config";

export default function AvailableOrders({
  orders,
  retailerId,
  config,
  onAccept,
  deliverySettings,
  retailerProfile,
}) {
  const [accepting, setAccepting] = useState(null);
  const [showPaylinkDialog, setShowPaylinkDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [paylinkUrl, setPaylinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async (order) => {
    setAccepting(order.id);

    const acceptedRetailers = Array.isArray(order.accepted_retailers)
    ? order.accepted_retailers
    : [];

    const position = acceptedRetailers.length > 0 ? acceptedRetailers.length : 1;

    // Get device info for tracking
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

    //If this is the first acceptance, make them the active retailer
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
      // Mark as pending delivery boy assignment
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
    
    await OrderApi.acceptOrder(apiData);

    // //Update retailer's current_orders count and active_order_ids (for tracking, not limiting)
    // await Retailer.update(retailerId, {
    //   current_orders: (retailerProfile?.current_orders || 0) + 1,
    //   active_order_ids: [...(retailerProfile?.active_order_ids || []), order.id]
    // });

    // // Send customer notification
    // if (position === 1) {
    //   const { notifyOrderAcceptedByRetailer } = await import('../utils/customerNotifications');
    //   await notifyOrderAcceptedByRetailer({...order, ...updateData}, retailerProfile);
    // }

    // // NEW: Notify all active delivery boys under this retailer
    // if (position === 1) {
    //   await notifyAllDeliveryBoys(order, retailerProfile);
    // }

    if (typeof onAccept === "function") {
      await onAccept();
    }

    setAccepting(null);

    // If payment link needed and this retailer is active, show dialog immediately
    if (order.payment_type === "needs_paylink") {
      setPendingOrder({ ...order, ...updateData });
      setShowPaylinkDialog(true);
    } else {
      onAccept();
    }
  };

  // Notify all active delivery boys about new order
  const notifyAllDeliveryBoys = async (order, retailer) => {
    const allDeliveryBoys = retailer.delivery_boys || [];
    const { DeliveryPartner } = await import("@/api/entities"); // Import once

    const matchingDeliveryBoysPromises = allDeliveryBoys.map(async (db) => {
      if (!db.is_active) {
        console.log(
          `⏭️ Skipping ${db.name} (ID: ${db.delivery_partner_id}) - Not active`
        );
        return null;
      }

      // Check vehicle type match
      // If order.required_vehicle_type is not specified, any vehicle type is allowed.
      // If it is specified, the delivery boy's vehicle_type must match.
      if (
        order.required_vehicle_type &&
        db.vehicle_type !== order.required_vehicle_type
      ) {
        console.log(
          `⏭️ Skipping ${db.name} (ID: ${db.delivery_partner_id}) - Vehicle mismatch (needs ${order.required_vehicle_type}, has ${db.vehicle_type})`
        );
        return null;
      }

      // Check mutual partnership
      // The DB must have also selected this retailer in their partnered_retailers
      const partner = await DeliveryPartner.get(db.delivery_partner_id);

      if (!partner) {
        console.log(
          `⏭️ Skipping ${db.name} (ID: ${db.delivery_partner_id}) - Delivery Partner not found in DB`
        );
        return null;
      }

      const hasRetailerInPreferences = (partner.partnered_retailers || []).some(
        (pr) =>
          pr.retailer_id === retailer.id && pr.partnership_status === "approved"
      );

      if (!hasRetailerInPreferences) {
        console.log(
          `⏭️ Skipping ${db.name} (ID: ${db.delivery_partner_id}) - Hasn't selected this retailer in their preferences or not approved`
        );
        return null;
      }

      return db; // If all checks pass, return the delivery boy
    });

    const resolvedDeliveryBoys = await Promise.all(
      matchingDeliveryBoysPromises
    );
    const activeDeliveryBoys = resolvedDeliveryBoys.filter((db) => db !== null); // Filter out nulls

    if (activeDeliveryBoys.length === 0) {
      console.log(
        `⚠️ No matching delivery boys found for ${
          order.required_vehicle_type
            ? order.required_vehicle_type + " order"
            : "order with any vehicle type"
        } from retailer ${retailer.id}`
      );
      return;
    }

    console.log(
      `📢 Notifying ${activeDeliveryBoys.length} ${
        order.required_vehicle_type || "any vehicle type"
      } delivery boys about order ${order.id}`
    );

    // In a real system, you would send push notifications via FCM/OneSignal
    // For now, we'll update the order to mark that notifications were sent
    // Delivery boys will see this order when they check their available orders list

    // Send SMS/WhatsApp to each delivery boy
    for (const db of activeDeliveryBoys) {
      if (db.phone) {
        await sendDeliveryBoyNotification(db, order, retailer);
      }
    }
  };

  const sendDeliveryBoyNotification = async (deliveryBoy, order, retailer) => {
    const vehicleEmoji =
      order.required_vehicle_type === "2_wheeler"
        ? "🏍️"
        : order.required_vehicle_type === "4_wheeler"
        ? "🚗"
        : "📦"; // Default emoji

    const message = `${vehicleEmoji} NEW ${
      order.required_vehicle_type
        ? order.required_vehicle_type.toUpperCase()
        : "ANY VEHICLE"
    } DELIVERY!

Order #${order.website_ref || order.id.slice(0, 8)}
💰 Earn: ₹${(order.amount * 0.1).toFixed(0)} (estimated)
📍 Distance: ${order.distance_km || "Unknown"} km
⏱️ Deliver in: ${order.sla_minutes || 60} min

${order.customer_name}
${order.drop_address?.city}

🏃 First to accept gets the order!
Login NOW!

${retailer.full_name}`;

    try {
      // Send via SMS
      await fetch("https://api.sarv.com/api/v2.0/sms_campaign.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: window.REACT_APP_SARV_API_TOKEN || "YOUR_TOKEN",
          sender: "CARTDD",
          route: "TR",
          mobile: deliveryBoy.phone.replace("+91", ""),
          message: message,
        }),
      });

      console.log(
        `✅ Notified delivery boy: ${deliveryBoy.name} for ${
          order.required_vehicle_type || "any vehicle type"
        } order`
      );
    } catch (error) {
      console.error(`Error notifying delivery boy ${deliveryBoy.name}:`, error);
    }
  };

  const paymentInfo = {
    cash_on_delivery: {
      label: "Cash on Delivery",
      icon: BadgeIndianRupee,
      className: "bg-green-50 text-green-700 border border-green-200",
      iconClass: "text-green-600"
    },
    needs_paylink: {
      label: "Payment Link Required",
      icon: LinkIcon,
      className: "bg-orange-50 text-orange-700 border border-orange-200",
      iconClass: "text-orange-600"
    },
    prepaid: {
      label: "Prepaid",
      icon: Wallet,
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      iconClass: "text-blue-600"
    },
    upi: {
      label: "UPI",
      icon: Smartphone,
      className: "bg-purple-50 text-purple-700 border border-purple-200",
      iconClass: "text-purple-600"
    },
    card: {
      label: "Card Payment",
      icon: CreditCard,
      className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      iconClass: "text-indigo-600"
    },
    phonepe: {
      label: "PhonePe",
      icon: Smartphone,
      className: "bg-violet-50 text-violet-700 border border-violet-200",
      iconClass: "text-violet-600"
    },
    google_pay: {
      label: "Google Pay",
      icon: Smartphone,
      className: "bg-red-50 text-red-700 border border-red-200",
      iconClass: "text-red-600"
    },
    paytm: {
      label: "Paytm",
      icon: Smartphone,
      className: "bg-cyan-50 text-cyan-700 border border-cyan-200",
      iconClass: "text-cyan-600"
    },
  };



  const handleSubmitPaylink = async () => {
    if (!paylinkUrl || !pendingOrder) return;

    setSubmitting(true);
    await Order.update(pendingOrder.id, {
      paylink_url: paylinkUrl,
      paylink_generated_at: new Date().toISOString(),
      payment_status: "paylink_sent",
    });

    // Send payment link notification
    const { notifyPaymentLink } = await import(
      "../utils/customerNotifications"
    );
    await notifyPaymentLink(pendingOrder, paylinkUrl);

    setSubmitting(false);
    setShowPaylinkDialog(false);
    setPaylinkUrl("");
    setPendingOrder(null);
    onAccept();
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

    // Update this retailer's acceptance status
    const updatedAcceptances = pendingOrder.accepted_retailers.map((ar) =>
      ar.retailer_id === retailerId ? { ...ar, status: "cancelled" } : ar
    );

    // Find next retailer in line
    const nextRetailer = updatedAcceptances.find(
      (ar) => ar.status === "active" && ar.retailer_id !== retailerId
    );

    await Order.update(pendingOrder.id, {
      accepted_retailers: updatedAcceptances,
      active_retailer_id: nextRetailer?.retailer_id || null,
      active_retailer_info: nextRetailer || null,
      status: nextRetailer ? "accepted_primary" : "pending_acceptance",
      penalties,
    });

    // Decrement retailer's current_orders count and remove from active_order_ids
    await Retailer.update(retailerId, {
      current_orders: Math.max(0, (retailerProfile?.current_orders || 0) - 1),
      active_order_ids: (retailerProfile?.active_order_ids || []).filter(
        (id) => id !== pendingOrder.id
      ),
    });

    setSubmitting(false);
    setShowPaylinkDialog(false);
    setShowCancelDialog(false);
    setPaylinkUrl("");
    setPendingOrder(null);
    onAccept();
  };
  console.log(orders);
  // Filter orders based on COD preference and status
  const filteredOrders = orders.filter((order) => {
    // Show pending orders and queued orders
    if (
      order.status !== "pending" &&
      order.status !== "UNASSIGNED" &&
      order.assignemnt_status !== "assigned" &&
      order.status !== "queued"
    )
      return false;

    // If order is COD, only show to retailers who accept COD
    if (order.is_cod || order.payment_method === "cod") {
      return retailerProfile?.accepts_cod === true;
    }
    // Non-COD orders shown to everyone
    return true;
  });
  console.log("Filtered Orders:", filteredOrders);

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
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const amount = parseFloat(
            (order.amount || order.total_amount || "0")
              .toString()
              .replace(/,/g, "")
          );

          let charges = null;

          if (!deliverySettings) {
            console.warn("⚠️ Delivery settings not available");
          } else {
            charges = calculateDeliveryCharges(
              amount,
              order.distance_km,
              deliverySettings
            );
            console.log("Charges:", charges);
          }

          // Now you can safely use it
          console.log("Final:", charges);

          if (!charges) {
            console.warn(
              `⚠️ Charges are null for order ID: ${order.id}, subtotal: ${order.amount}, distance_km: ${order.distance_km}`
            );
          }
          console.log("Order ID:", order.id);
          console.log("Amount:", amount);
          console.log("Distance KM:", 5);
          console.log("DeliverySettings:", deliverySettings);
          console.log("Charges:", charges);

          if (!charges) {
            console.warn(
              `⚠️ Charges are null for order ID: ${order.id}, subtotal: ${order.amount}, distance_km: ${order.distance_km}`
            );
          }
          const acceptedCount = order.accepted_retailers?.length || 0;
          const maxAcceptances =
            order.max_acceptances || config?.max_retailer_acceptances || 3;
          const isCOD = order.is_cod || order.payment_method === "cod";
          const isQueued = order.status === "queued" || order.is_queued;

          return (
            <Card
              key={order.id}
              className={`border-none shadow-lg hover:shadow-xl transition-shadow ${
                isQueued ? "border-2 border-amber-500" : ""
              }`}
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
                    <h3 className="text-lg font-bold text-gray-900">
                      {`Order #${order.id}`}
                    </h3>
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
                              {item.name}
                            </span>
                            <span className="font-bold text-gray-900">
                              ₹{order.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery Earnings - Prominent Display */}
                  {charges?.delivery_charge > 0 && (
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
                            {order.distance_km} km
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Fuel Cost (₹
                            {deliverySettings?.fuel_cost_per_km || 5}/km):
                          </span>
                          <span className="font-medium">
                            ₹{charges.fuelCost}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Base Charge:</span>
                          <span className="font-medium">
                            ₹{charges.baseCharge}
                          </span>
                        </div>
                        

                        <div className="flex justify-between pt-1 border-t border-green-300 font-semibold">
                          <span>Total Delivery Charge:</span>
                          <span>₹{charges.delivery_charge}</span>
                        </div>
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
                          const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
                          const formattedMinutes = minutes.toString().padStart(2, "0");
                          return `${formattedHours}:${formattedMinutes} ${ampm}`;
                        })()}
                      </span>
                    </div>

                    {/* Distance */}
                    {order.distance_km && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <NavigationIcon className="w-4 h-4" />
                          <span className="font-medium">{order.distance_km} km away</span>
                        </div>
                      </>
                    )}

                    {/* SLA */}
                    {order.sla_minutes && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-amber-600 font-medium">
                          ⏱️ ~{Math.ceil(order.distance_km * 3)} min travel time
                        </span>
                      </>
                    )}

                    {/* Payment Method */}
                    {paymentInfo[order.payment_type] && (
                      <>
                        <span className="text-gray-400">•</span>

                        <div
                          className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${paymentInfo[order.payment_type].className}`}
                        >
                          {React.createElement(paymentInfo[order.payment_type].icon, {
                            size: 16,
                            className: paymentInfo[order.payment_type].iconClass,
                          })}

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

                        {order.distance_km && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-blue-700 font-medium">
                              📍 {order.distance_km} km from your location
                            </span>
                            {order.sla_minutes && (
                              <span className="text-amber-700 font-medium">
                                ⏱️ ~{Math.ceil(order.distance_km * 3)} min
                                travel time
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
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        <strong>Payment Link Required</strong> - You'll have{" "}
                        {config?.paylink_timeout_sec || 150} seconds to generate
                        payment link after accepting
                        {order.customer_payment_preference &&
                          order.customer_payment_preference.length > 0 && (
                            <div className="mt-1 text-xs">
                              Send to:{" "}
                              {order.customer_payment_preference
                                .join(", ")
                                .toUpperCase()}
                            </div>
                          )}
                      </AlertDescription>
                    </Alert>
                  )}


                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <Button
                      onClick={() => handleAccept(order)}
                      disabled={accepting === order.id}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg"
                    >
                      {accepting === order.id
                        ? "Accepting..."
                        : `Accept Order - Notify Delivery Boys`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Link Dialog */}
      <Dialog open={showPaylinkDialog} onOpenChange={() => {}}>
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
                      )
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
    </>
  );
}
