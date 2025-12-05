
import { deliverySettingApi } from "./deliverySettingApi";

/**
 * Calculate delivery charges for an order
 * Returns: { delivery_charge, rider_payout, seller_net_payable }
 */
export async function calculateDeliveryCharges(orderValue, distanceKm, config) {
  
  try {
     if (!config) {
    console.warn("No delivery config available, returning null");
    return null; 
  }

    // Calculate fuel cost
    const fuelCost = distanceKm * (config.fuel_cost_per_km || 5);
    
    // Determine base charge based on order value
    const baseCharge = orderValue >= (config.delivery_charge_threshold || 20000)
      ? (config.base_delivery_charge_high || 125)
      : (config.base_delivery_charge_low || 75);
    
    // Total delivery charge
    const deliveryCharge = Math.round(fuelCost + baseCharge);
    
    // Rider gets 100% of delivery charge (paid from seller's settlement deduction)
    const riderPayout = deliveryCharge;
    
    // Seller receives order value minus delivery charges
    const sellerNetPayable = orderValue - deliveryCharge;
    
    return {
      delivery_charge: deliveryCharge,
      rider_payout: riderPayout,
      seller_net_payable: Math.max(0, sellerNetPayable)
    };
    
  } catch (error) {
    console.error("Error calculating delivery charges:", error);
    return {
      delivery_charge: 100,
      rider_payout: 100,
      seller_net_payable: orderValue - 100
    };
  }
}

/**
 * Check if within business hours
 */
export function isWithinBusinessHours(config) {
  if (!config) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = (config.business_hours_start || "08:00").split(':').map(Number);
  const [endHour, endMin] = (config.business_hours_end || "22:00").split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Check if insufficient retailer coverage
 */
export function hasInsufficientRetailerCoverage(onlineCount, totalCount, config) {
  if (!config || totalCount === 0) return false;
  
  const percentage = (onlineCount / totalCount) * 100;
  const threshold = config.min_online_retailers_percentage || 50;
  
  return percentage < threshold;
}

/**
 * Notify customer that order is queued
 */
export async function notifyCustomerOrderQueued(order) {
  console.log(`📧 Notifying customer ${order.customer_name} that order ${order.id} is queued`);
  // TODO: Implement actual SMS/WhatsApp notification
  // For now, just log
}