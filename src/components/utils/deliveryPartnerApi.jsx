import { API_BASE_URL } from "../../config";

export const deliveryPartnerApi = {
  list: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery_boy`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch delivery partners");
    return res.json();
  },

  getApprovedDeliveryBoys: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/retailer/delivery-partners/approved`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch delivery partners");
    return res.json();
  },

  getByUserId: async (userId) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery_boy/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch delivery partner");
    return res.json();
  },

  update: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery_boy/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update retailer");
    return res.json();
  },

  ban: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery-partners/${id}/ban`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to ban retailer");
    return res.json();
  },

  unban: async (id) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partners/${id}/unban`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to unban retailer");
    return res.json();
  },

  rating: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partners/${id}/rating`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error("Failed to rate retailer");
    return res.json();
  },

  getAvailableOrders: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/available-orders`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch available orders");
    return res.json();
  },

  acceptOrder: async (orderId, partnerId) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/accept-order/${orderId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partner_id: partnerId }),
      }
    );
    if (!res.ok) throw new Error("Failed to accept order");
    return res.json();
  },

  getMyDeliveries: async (partnerId) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/my-deliveries/${partnerId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch deliveries");
    return res.json();
  },

  getMyCompletedDeliveries: async (partnerId) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/my-completed-deliveries/${partnerId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch deliveries");
    return res.json();
  },

  getNotifications: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/notifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  getStats: async (partnerId) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/${partnerId}/stats`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
  },

  changeBank: async (payload) => {
    const token = sessionStorage.getItem("token");

    // 1. Throw error if no token
    if (!token) {
      throw new Error("Authentication token missing.");
    }

    const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/change-bank`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // 2. Handle non-2xx responses
    if (!res.ok) {
      const errorBody = await res.json();
      const error = new Error(
        errorBody.message || `HTTP error! Status: ${res.status}`
      );
      error.response = { data: errorBody, status: res.status };
      throw error;
    }

    // 3. CRITICAL FIX: Return the JSON response
    return await res.json();
  },

  updateProfile: async (payload) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token missing.");
    }

    const res = await fetch(`${API_BASE_URL}/api/delivery-partner/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorBody = {};
      try {
        errorBody = await res.json();
      } catch (_) {}

      const error = new Error(
        errorBody.message || `Request failed (${res.status})`
      );

      error.response = {
        data: errorBody,
        status: res.status,
      };

      throw error;
    }
    return await res.json();
  },
};
