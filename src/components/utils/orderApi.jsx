import { API_BASE_URL } from "../../config";

export const OrderApi = {
  list: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch retailers");
    return res.json();
  },

  updateList: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/retailer/ordersList`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch retailers");
    return res.json();
  },

  PendingAcceptanceOrders: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/retailer/orders/pending-acceptance`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to fetch retailer orders");
    return res.json();
  },

  acceptCOD: async (retailerId, payload) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/retailer/accept-cod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        retailer_id: retailerId,
        ...payload,
      }),
    });

    if (!res.ok) throw new Error("Failed to update COD preference");
    return res.json();
  },

  acceptOrder: async (data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to accept order");
    return res.json();
  },

  AcceptedOrders: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/accepted`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getSellerStats: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/retailer/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  PendingOrders: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/retailer/pendingorders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  CompletedOrders: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/completed`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch completed orders");
    return res.json();
  },

  RejectedOrders: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/rejected`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch rejected orders");
    return res.json();
  },

  SubmitPayLink: async (payload) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/retailer/orders/submit-paylink`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();

    if (res.status === 422) {
      throw { type: "validation", errors: data.errors };
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to submit paylink");
    }

    return data;
  },

  updateRetailerStatus: async (orderCode, payload) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/retailer/orders/${orderCode}/updateRetailerStatus`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) throw new Error("Failed to update retailer status");
    return res.json();
  },

  updateOrder: async (orderCode, payload) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/retailer/orders/${orderCode}/updateOrder`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) throw new Error("Failed to update order");
    return res.json();
  },

  storeImei: async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/store-imei`, {
        method: "POST",
        body: formData, // send FormData directly
        // Do NOT set Content-Type manually! fetch will set correct multipart boundary automatically
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "IMEI validation failed");
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  storeVideo: async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/store-video`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Video validation failed");
      }

      return data;
    } catch (err) {
      throw err;
    }
  },
};
