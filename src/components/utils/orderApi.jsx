import { exit } from "process";
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

  PendingAcceptanceOrders: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/pending-acceptance`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch retailer orders");
    return res.json();
  },

  acceptCOD: async (data) => {
    const token = sessionStorage.getItem("token");
    
    const res = await fetch(`${API_BASE_URL}/api/retailer/accept-cod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update COD preference");
    return res.json();
  },

  acceptOrder: async (apiData) => {
    const token = sessionStorage.getItem("token");
    console.log(apiData);
    exit;
    const res = await fetch(`${API_BASE_URL}/api/retailer/orders/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(apiData),
    });

    if (!res.ok) throw new Error("Failed to accept order");
    return res.json();
  },
};
