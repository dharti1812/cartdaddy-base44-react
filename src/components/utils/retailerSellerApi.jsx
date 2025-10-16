import { API_BASE_URL } from "../../config";

export const RetailerSellerApi  = {
  list: async () => {
    const token = localStorage.getItem("token");
    console.log("Token:", token);
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
     const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}`, {
      method: "PUT", // or PATCH
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update retailer");
    return res.json();
  },

  approve: async (id) => {
    const token = localStorage.getItem("token");
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

};
