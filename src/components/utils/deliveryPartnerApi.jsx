import { API_BASE_URL } from "../../config";

export const DeliveryPartnerApi = {
  list: async () => {
    const token = localStorage.getItem("access_token");
    console.log("Token:", token);
    const res = await fetch(`${API_BASE_URL}/api/delivery_boy`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch delivery partners");
    return res.json();
  },

  update: async (id, data) => {
     const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/api/delivery_boy/${id}`, {
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


};
