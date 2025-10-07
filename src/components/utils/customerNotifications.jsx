
/**
 * Customer Notification System - Swiggy/Zomato Style
 * 
 * Sends detailed updates to customers at every stage:
 * - Order Accepted
 * - Payment Link Sent
 * - Delivery Partner Assigned
 * - Out for Delivery
 * - Nearby (5 min away)
 * - Arrived at Location
 * - Delivered
 */

// import { sendSMSOTP, sendWhatsAppOTP } from './sarvAPI';

const APP_URL = window.location.origin;

/**
 * Generate tracking URL for customer
 */
export const getTrackingUrl = (orderId) => {
  return `${APP_URL}/TrackOrder?order=${orderId}`;
};

/**
 * Send notification via multiple channels
 */
const sendNotification = async (phone, message, channels = ['sms', 'whatsapp']) => {
  const results = [];
  
  for (const channel of channels) {
    try {
      let result;
      if (channel === 'sms') {
        result = await fetch("https://api.sarv.com/api/v2.0/sms_campaign.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: window.REACT_APP_SARV_API_TOKEN || "YOUR_TOKEN",
            sender: "CARTDD",
            route: "TR",
            mobile: phone.replace("+91", ""),
            message: message
          })
        });
      } else if (channel === 'whatsapp') {
        result = await fetch("https://api.sarv.com/api/v2.0/whatsapp_campaign.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: window.REACT_APP_SARV_API_TOKEN || "YOUR_TOKEN",
            mobile: phone.replace("+91", ""),
            message: message
          })
        });
      }
      results.push({ channel, success: true });
    } catch (error) {
      console.error(`Error sending ${channel}:`, error);
      results.push({ channel, success: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * 1. Order Accepted by Retailer (Updated)
 */
export const notifyOrderAcceptedByRetailer = async (order, retailer) => {
  const trackingUrl = getTrackingUrl(order.id);
  
  const message = `🎉 Order Accepted!

Your order #${order.website_ref || order.id.slice(0, 8)} has been accepted by ${retailer.full_name}

📦 Items: ${order.items?.length || 0} item(s)
💰 Total: ₹${order.total_amount}
⏱️ Estimated delivery: ${order.sla_minutes || 60} minutes

🏍️ Finding best delivery partner...

📍 Track your order live:
${trackingUrl}

Thank you for choosing Cart Daddy! 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 1. Order Accepted Notification
 */
export const notifyOrderAccepted = async (order, retailer) => {
  const trackingUrl = getTrackingUrl(order.id);
  
  const message = `🎉 Order Accepted!

Your order #${order.website_ref || order.id.slice(0, 8)} has been accepted by ${retailer.full_name}

📦 Items: ${order.items?.length || 0} item(s)
💰 Total: ₹${order.total_amount}
⏱️ Estimated delivery: ${order.sla_minutes || 60} minutes

📍 Track your order live:
${trackingUrl}

Thank you for choosing Cart Daddy! 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 2. Payment Link Notification
 */
export const notifyPaymentLink = async (order, paylinkUrl) => {
  const message = `💳 Complete Your Payment

Order #${order.website_ref || order.id.slice(0, 8)}
Amount: ₹${order.total_amount}

Click here to pay securely:
${paylinkUrl}

⏰ Link expires in 5 minutes
Once paid, your order will be prepared for delivery.

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 3. Delivery Partner Assigned Notification
 */
export const notifyDeliveryPartnerAssigned = async (order, deliveryBoy, retailer) => {
  const trackingUrl = getTrackingUrl(order.id);
  
  const message = `🏍️ Delivery Partner Assigned!

Your order #${order.website_ref || order.id.slice(0, 8)} is being prepared

👤 Delivery Partner: ${deliveryBoy.name}
📱 Phone: ${deliveryBoy.phone}
🚲 Vehicle: ${retailer.vehicle_type || 'Bike'}

Your order will be ready for pickup soon!

📍 Track live location:
${trackingUrl}

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 4. Out for Delivery Notification
 */
export const notifyOutForDelivery = async (order, deliveryBoy, estimatedMinutes) => {
  const trackingUrl = getTrackingUrl(order.id);
  
  const message = `🚀 Your Order is Out for Delivery!

Order #${order.website_ref || order.id.slice(0, 8)}

👤 ${deliveryBoy.name} is on the way
⏱️ Arriving in ~${estimatedMinutes} minutes

📍 Track live location:
${trackingUrl}

Keep ₹${order.total_amount} ready ${order.is_cod ? '(Cash)' : '(Already Paid)'}

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 5. Nearby Notification (5 min away)
 */
export const notifyNearby = async (order, deliveryBoy) => {
  const message = `📍 Delivery Partner Nearby!

${deliveryBoy.name} is just 5 minutes away from your location!

Order #${order.website_ref || order.id.slice(0, 8)}
Amount: ₹${order.total_amount} ${order.is_cod ? '(COD)' : '(Paid)'}

Please be ready to receive your order 🎉

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 6. Arrived at Location Notification
 */
export const notifyArrived = async (order, deliveryBoy) => {
  const message = `🎯 Delivery Partner Has Arrived!

${deliveryBoy.name} is at your location with your order!

Order #${order.website_ref || order.id.slice(0, 8)}
${order.is_cod ? `💵 Please pay ₹${order.total_amount} in cash` : '✅ Already paid'}

📱 Can't find? Call: ${deliveryBoy.phone}

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 7. Order Delivered Notification
 */
export const notifyDelivered = async (order, deliveryBoy) => {
  const message = `✅ Order Delivered Successfully!

Thank you for ordering with Cart Daddy! 🎉

Order #${order.website_ref || order.id.slice(0, 8)}
Delivered by: ${deliveryBoy.name}
Amount: ₹${order.total_amount}

⭐ Rate your experience:
How was your delivery? Your feedback helps us serve you better!

Hope you enjoyed! Order again soon 🛒

Cart Daddy`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * 8. Order Cancelled Notification
 */
export const notifyCancelled = async (order, reason) => {
  const message = `❌ Order Cancelled

We're sorry! Your order #${order.website_ref || order.id.slice(0, 8)} has been cancelled.

Reason: ${reason}

${!order.is_cod && order.payment_status === 'paid' ? '💰 Refund will be processed within 3-5 business days' : ''}

We apologize for the inconvenience. Please try ordering again!

Cart Daddy 🛒`;

  return await sendNotification(
    order.customer_phone || order.customer_masked_contact,
    message,
    order.customer_payment_preference || ['sms', 'whatsapp']
  );
};

/**
 * Master function to send appropriate notification based on order status
 */
export const notifyCustomerOnStatusChange = async (order, previousStatus, retailer, deliveryBoy) => {
  try {
    const status = order.status;
    
    switch (status) {
      case 'accepted_primary':
      case 'assigned':
        return await notifyOrderAccepted(order, retailer);
      
      case 'payment_pending':
        if (order.paylink_url) {
          return await notifyPaymentLink(order, order.paylink_url);
        }
        break;
      
      case 'assigned_to_delivery_boy':
        if (deliveryBoy) {
          return await notifyDeliveryPartnerAssigned(order, deliveryBoy, retailer);
        }
        break;
      
      case 'en_route':
        if (deliveryBoy) {
          const estimatedMinutes = order.distance_km ? Math.ceil(order.distance_km * 3) : 30;
          return await notifyOutForDelivery(order, deliveryBoy, estimatedMinutes);
        }
        break;
      
      case 'arrived':
        if (deliveryBoy) {
          return await notifyArrived(order, deliveryBoy);
        }
        break;
      
      case 'delivered':
        if (deliveryBoy) {
          return await notifyDelivered(order, deliveryBoy);
        }
        break;
      
      case 'cancelled':
        return await notifyCancelled(order, order.cancellation_reason || 'Seller was unable to fulfill the order');
      
      default:
        console.log(`No notification configured for status: ${status}`);
    }
  } catch (error) {
    console.error("Error sending customer notification:", error);
    return { success: false, error: error.message };
  }
};
