import { API_BASE_URL } from "../../config";

export const AuthApi = {
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) throw new Error("Failed to login");
    return res.json();
  },

  validateToken: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/validate-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { valid: false };
    return await res.json();
  },

  checkRole: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/check-role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { authorized: false };
    return await res.json();
  },

  sendOTPtoMobile: async (phone, name, userCode) => {
    const res = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, userCode }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  },

  verifyOTP: async (phone, phone_otp) => {
    const res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, phone_otp }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  },
};
