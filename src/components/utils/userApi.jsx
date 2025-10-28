import { API_BASE_URL } from "../../config";

export const UserApi = {
  list: async () => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/customers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch retailers");
    return res.json();
  },

  me: async () => {
    const token = sessionStorage.getItem("token");

    if (!token) throw new Error("No token found");

    const res = await fetch(`${API_BASE_URL}/api/user`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch user info");
    return res.json();
  },
};
