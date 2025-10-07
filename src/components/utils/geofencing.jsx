/**
 * Geofencing and Priority-based Retailer Filtering
 * 
 * This module handles:
 * 1. Geofencing - Finding retailers within X meters of delivery location
 * 2. Priority Tiers - Filtering retailers by performance tiers
 * 3. Distance Calculation - Haversine formula for accurate distance
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Filter retailers within geofence radius
 * @param {Array} retailers - List of all retailers
 * @param {Object} deliveryLocation - {lat, lng} of delivery address
 * @param {number} radiusMeters - Geofence radius in meters
 * @returns {Array} Retailers within geofence with distance
 */
export const filterRetailersInGeofence = (retailers, deliveryLocation, radiusMeters) => {
  if (!deliveryLocation || !deliveryLocation.lat || !deliveryLocation.lng) {
    console.warn("Invalid delivery location provided");
    return [];
  }

  return retailers
    .filter(retailer => {
      // Must be online and have location
      if (retailer.availability_status !== 'online') return false;
      if (!retailer.current_location?.lat || !retailer.current_location?.lng) return false;

      // Calculate distance
      const distance = calculateDistance(
        deliveryLocation.lat,
        deliveryLocation.lng,
        retailer.current_location.lat,
        retailer.current_location.lng
      );

      // Check if within geofence
      return distance <= radiusMeters;
    })
    .map(retailer => ({
      ...retailer,
      distance_meters: calculateDistance(
        deliveryLocation.lat,
        deliveryLocation.lng,
        retailer.current_location.lat,
        retailer.current_location.lng
      ),
      distance_km: (calculateDistance(
        deliveryLocation.lat,
        deliveryLocation.lng,
        retailer.current_location.lat,
        retailer.current_location.lng
      ) / 1000).toFixed(2)
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters);
};

/**
 * Categorize retailer into priority tier based on performance metrics
 * @param {Object} retailer - Retailer object
 * @returns {string} Priority tier name
 */
export const calculateRetailerTier = (retailer) => {
  const rating = retailer.rating || 0;
  const successRate = retailer.successful_deliveries && retailer.total_deliveries
    ? (retailer.successful_deliveries / retailer.total_deliveries) * 100
    : 0;
  const experienceMonths = retailer.created_date 
    ? Math.floor((Date.now() - new Date(retailer.created_date).getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0;

  // Tier 1: Premium Sellers
  if (rating >= 4.7 && successRate >= 95 && experienceMonths >= 6) {
    return 'tier_1_premium';
  }
  
  // Tier 2: Preferred Sellers
  if (rating >= 4.5 && successRate >= 90 && experienceMonths >= 3) {
    return 'tier_2_preferred';
  }
  
  // Tier 3: Standard Sellers
  if (rating >= 4.0 && successRate >= 85) {
    return 'tier_3_standard';
  }
  
  // Tier 4: Backup Sellers
  return 'tier_4_backup';
};

/**
 * Filter and sort retailers by priority tier
 * @param {Array} retailers - List of retailers (already filtered by geofence)
 * @param {Array} priorityTiers - Priority tier configuration
 * @returns {Object} Retailers grouped by tier
 */
export const groupRetailersByPriority = (retailers, priorityTiers) => {
  const grouped = {
    tier_1_premium: [],
    tier_2_preferred: [],
    tier_3_standard: [],
    tier_4_backup: []
  };

  retailers.forEach(retailer => {
    const tier = calculateRetailerTier(retailer);
    if (grouped[tier]) {
      grouped[tier].push(retailer);
    }
  });

  return grouped;
};

/**
 * Get retailers in priority order for order broadcasting
 * Returns retailers sorted by: Tier (1→4) then Distance (nearest first)
 * @param {Array} retailers - All available retailers
 * @param {Object} deliveryLocation - Delivery address coordinates
 * @param {number} radiusMeters - Geofence radius
 * @param {Array} priorityTiers - Priority tier config
 * @returns {Array} Sorted retailers with tier and distance info
 */
export const getPrioritizedRetailers = (retailers, deliveryLocation, radiusMeters, priorityTiers) => {
  // Step 1: Filter by geofence
  const inGeofence = filterRetailersInGeofence(retailers, deliveryLocation, radiusMeters);
  
  if (inGeofence.length === 0) {
    console.warn("No retailers found in geofence. Consider expanding radius.");
    return [];
  }

  // Step 2: Add tier to each retailer
  const withTiers = inGeofence.map(retailer => ({
    ...retailer,
    priority_tier: calculateRetailerTier(retailer)
  }));

  // Step 3: Sort by tier (1→4) then by distance (nearest first)
  const tierOrder = {
    'tier_1_premium': 1,
    'tier_2_preferred': 2,
    'tier_3_standard': 3,
    'tier_4_backup': 4
  };

  const sorted = withTiers.sort((a, b) => {
    // First sort by tier
    const tierDiff = tierOrder[a.priority_tier] - tierOrder[b.priority_tier];
    if (tierDiff !== 0) return tierDiff;
    
    // If same tier, sort by distance
    return a.distance_meters - b.distance_meters;
  });

  return sorted;
};

/**
 * Expand geofence radius incrementally if no retailers found
 * @param {Array} retailers - All retailers
 * @param {Object} deliveryLocation - Delivery coordinates
 * @param {number} initialRadius - Starting radius in meters
 * @param {number} maxRadius - Maximum radius in meters
 * @param {number} step - Increment step in meters
 * @returns {Object} {retailers: Array, appliedRadius: number}
 */
export const expandGeofenceUntilFound = (retailers, deliveryLocation, initialRadius, maxRadius = 20000, step = 2000) => {
  let currentRadius = initialRadius;
  let found = [];

  while (currentRadius <= maxRadius) {
    found = filterRetailersInGeofence(retailers, deliveryLocation, currentRadius);
    
    if (found.length > 0) {
      console.log(`✅ Found ${found.length} retailers at ${currentRadius}m radius`);
      return {
        retailers: found,
        appliedRadius: currentRadius,
        expanded: currentRadius > initialRadius
      };
    }
    
    console.log(`🔍 No retailers at ${currentRadius}m, expanding...`);
    currentRadius += step;
  }

  console.warn(`⚠️ No retailers found even at maximum radius of ${maxRadius}m`);
  return {
    retailers: [],
    appliedRadius: maxRadius,
    expanded: true
  };
};