const fakeApiCall = (data, delay = 150) => new Promise(resolve => setTimeout(() => resolve(data), delay));

let mockOrders = [
    { id: 'ord_1', website_ref: 'WEB-1001', customer_name: 'Javed Ali', customer_phone: '9820098200', drop_address: { city: 'Mumbai', pincode: '400050', street: '123 Marine Drive' }, total_amount: 550, items: [{ name: 'Item A', quantity: 2 }], status: 'pending_acceptance', created_date: new Date().toISOString(), is_queued: false, sla_breach: false },
    { id: 'ord_2', website_ref: 'WEB-1002', customer_name: 'Priya Singh', customer_phone: '9820098201', drop_address: { city: 'Delhi', pincode: '110001', street: '456 Connaught Place' }, total_amount: 1200, items: [{ name: 'Item B', quantity: 1 }], status: 'en_route', created_date: new Date(Date.now() - 3600000).toISOString(), estimated_delivery_time: new Date(Date.now() - 1800000).toISOString(), is_queued: false, sla_breach: true, active_retailer_id: 'ret_1' },
    { id: 'ord_3', website_ref: 'WEB-1003', customer_name: 'Amit Kumar', customer_phone: '9820098202', drop_address: { city: 'Bangalore', pincode: '560001', street: '789 MG Road' }, total_amount: 890, items: [{ name: 'Item C', quantity: 3 }], status: 'delivered', created_date: new Date(Date.now() - 86400000).toISOString(), actual_delivery_time: new Date().toISOString(), is_queued: false, sla_breach: false },
];

let mockRetailers = [
    { id: 'ret_1', user_id: 'user-abc', full_name: 'Suresh Retail', business_name: 'Suresh Kirana', phone: '9876543210', email: 'seller@example.com', availability_status: 'online', rating: 4.8, successful_deliveries: 120, onboarding_status: 'approved', status: 'active', alternate_phones: [], shop_photos: [] },
    { id: 'ret_2', user_id: 'user-def', full_name: 'Rajesh Goods', business_name: 'Rajesh General Store', phone: '9876543211', email: 'seller2@example.com', availability_status: 'offline', rating: 4.5, successful_deliveries: 85, onboarding_status: 'approved', status: 'active', alternate_phones: [], shop_photos: [] },
    { id: 'ret_3', user_id: 'user-ghi', full_name: 'New Applicant', phone: '9876543212', email: 'new@example.com', onboarding_status: 'admin_approval_pending', status: 'pending_verification', alternate_phones: [], shop_photos: [] }
];

let mockDeliveryPartners = [
    { id: 'dp_1', full_name: 'Ravi Kumar', phone: '8765432109', email: 'dp1@example.com', status: 'active', onboarding_status: 'approved', vehicle_type: '2_wheeler', availability_status: 'online' },
    { id: 'dp_2', full_name: 'Sita Sharma', phone: '8765432108', email: 'dp2@example.com', status: 'active', onboarding_status: 'approved', vehicle_type: '2_wheeler', availability_status: 'offline' },
    { id: 'dp_3', full_name: 'Vijay Singh', phone: '8765432107', email: 'dp3@example.com', status: 'active', onboarding_status: 'retailers_pending' }
];

let mockUsers = [
    { id: 'user-admin', email: 'admin@example.com', full_name: 'Admin User', role: 'admin' },
    { id: 'user-superadmin', email: 'super@example.com', full_name: 'Super Admin', role: 'super_admin' },
];

let mockDispatchConfigs = [{
    id: 'cfg_1',
    config_name: "Default Config",
    is_active: true,
    geofence_radius_m: 5000,
    max_retailer_acceptances: 3,
    cancellation_penalty_percentage: 2.0,
    paylink_timeout_sec: 150,
    max_concurrent_orders: 3,
    fuel_cost_per_km: 5,
    delivery_charge_threshold: 20000,
    base_delivery_charge_low: 75,
    base_delivery_charge_high: 125,
    order_queue_enabled: true,
    min_online_retailers_percentage: 50,
    queue_retry_interval_minutes: 15,
    business_hours_start: "08:00",
    business_hours_end: "22:00",
    priority_tiers: [ { tier_name: "tier_1_premium", display_name: "Premium Partners", order_priority: 1, criteria: "Rating >= 4.7" } ],
}];

const genericMethods = (store) => ({
  list: (sort, limit) => fakeApiCall([...store]),
  filter: (filters) => fakeApiCall(store.filter(item => Object.keys(filters).every(key => item[key] === filters[key]))),
  update: (id, data) => { console.log(`(Mock) Updating ${id} with`, data); return fakeApiCall({ success: true }); },
  create: (data) => {
    const newItem = { id: `new-${Date.now()}`, ...data, created_date: new Date().toISOString() };
    store.unshift(newItem);
    console.log(`(Mock) Created new item`, newItem);
    return fakeApiCall(newItem);
  },
  delete: (id) => { console.log(`(Mock) Deleting ${id}`); return fakeApiCall({ success: true }); }
});

export const Order = genericMethods(mockOrders);
export const Retailer = genericMethods(mockRetailers);
export const DispatchConfig = genericMethods(mockDispatchConfigs);
export const DeliveryPartner = genericMethods(mockDeliveryPartners);
export const Communication = genericMethods([]);
export const Product = genericMethods([]);
export const GenerationJob = genericMethods([]);

export const User = {
  me: () => fakeApiCall(mockUsers[1]), // Simulate Super Admin login
  updateMyUserData: (data) => fakeApiCall({ success: true }),
  logout: () => fakeApiCall({ success: true }),
  list: () => fakeApiCall(mockUsers),
};