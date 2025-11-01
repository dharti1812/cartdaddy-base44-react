import { API_BASE_URL } from "../../config";

export const deliverySettingApi = {
  list: async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery-settings`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch delivery settings");
    return res.json();
  },

  create: async (data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create delivery setting");
    return res.json();
  },

  update: async (id, data) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/delivery-settings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update delivery setting");
    return res.json();
  },
};
