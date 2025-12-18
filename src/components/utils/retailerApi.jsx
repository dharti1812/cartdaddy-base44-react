import { API_BASE_URL } from "../../config";

const token = sessionStorage.getItem("token");

export const retailerApi = {
  list: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/sellers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch retailers");
    return res.json();
  },

  update: async (id, data) => {
    const token = sessionStorage.getItem("token");

    if (!token) throw new Error("Authentication token missing.");

    const res = await fetch(`${API_BASE_URL}/api/shops/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Update error:", errorText);
      throw new Error("Failed to update retailer");
    }

    return res.json();
  },

  approve: async (id) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to approve retailer");
    return res.json();
  },

  ban: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}/ban`, {
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
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}/unban`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to unban retailer");
    return res.json();
  },

  rating: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}/rating`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to rate retailer");
    return res.json();
  },

  deliveryPartners: async () => {
    const res = await fetch(`${API_BASE_URL}/api/retailer/delivery-partners`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch delivery partners");
    return await res.json();
  },

  getRetailerData: async () => {
    const res = sessionStorage.getItem("user");

    if (!res.ok) throw new Error("Failed to fetch delivery partners");
    return await res.json();
  },

  selectDeliveryPartners: async (payload) => {
    const res = await fetch(
      `${API_BASE_URL}/api/retailer/save-delivery-partners`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error("Failed to save delivery partners");
    return await res.json();
  },

  onlineRetailers: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/retailers/online`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch online retailers");
    return res.json();
  },

  changeBank: async (payload) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token missing.");
    }

    const res = await fetch(
      `${API_BASE_URL}/api/retailer/change-bank`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // 2. Handle non-2xx responses
    if (!res.ok) {
      const errorBody = await res.json();
      const error = new Error(errorBody.message || `HTTP error! Status: ${res.status}`);
      error.response = { data: errorBody, status: res.status };
      throw error;
    }

    // 3. CRITICAL FIX: Return the JSON response
    return await res.json();
  },
};
