import { API_BASE_URL } from "../../config";

export const rejectionsApi = {
  list: async (pageNo, perPage, search = "") => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/rejections?page=${pageNo}&per_page=${perPage}&search=${search}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to fetch rejections");
    return res.json();
  },

  approve: async (rejectionId) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/rejections/${rejectionId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to approve rejection");
    return res.json();
  },
  
  reject: async (rejectionId) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/rejections/${rejectionId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to reject rejection");
    return res.json();
  },
};
