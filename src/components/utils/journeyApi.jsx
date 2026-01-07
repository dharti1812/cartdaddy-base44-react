import { API_BASE_URL } from "../../config";

export const journeyApi = {
list: async (pageNo, perPage, search) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/journeys?page=${pageNo}&per_page=${perPage}&search=${search}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch journeys");
    return res.json();
  },

  recordVCardDownload: async (journeyId) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}/vcard-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to record vCard download");
    return res.json();
  },
};