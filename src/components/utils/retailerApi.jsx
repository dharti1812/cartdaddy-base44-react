import { API_BASE_URL } from "../../config";

export const RetailerApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/sellers`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch retailers");
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/api/shops/${id}`, {
      method: "PUT", // or PATCH
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update retailer");
    return res.json();
  },

 approve: async (id) => {
  const res = await fetch(`${API_BASE_URL}/api/shops/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to approve retailer');
  return res.json();
},

reject: async (id, reason) => {
  const res = await fetch(`${API_BASE_URL}/api/shops/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) throw new Error('Failed to reject retailer');
  return res.json();
},

};
