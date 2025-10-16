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


};
