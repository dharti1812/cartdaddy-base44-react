import { API_BASE_URL } from "../../config";

export const AuthApi = {
  login: async (identifier, password, userType) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password, userType }),
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
    console.log(res);
    return await res.json();
  },

  sendOTPtoMobile: async (phone, name, user_type, address) => {
    localStorage.removeItem("access_token");
    const res = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, user_type, address }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  },

  verifyOTP: async (phone, phone_otp, user_type) => {
    const res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, phone_otp, user_type }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  },

  sendOTPtoEmail: async (email, phone, user_type, address) => {
    console.log("🔍 Sending email OTP to:", email, "for phone:", phone);
    try {
      const res = await fetch(`${API_BASE_URL}/api/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, user_type, address }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      return await res.json();
    } catch (err) {
      console.error("❌ sendOTPtoEmail error:", err);
      return { success: false };
    }
  },

  verifyOTPtoEmail: async (email, phone, email_otp, user_type, address) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, email_otp, user_type, address }),
      });
      if (!res.ok) throw new Error("Failed to verify OTP");
      return await res.json();
    } catch (err) {
      console.error("❌ verifyOTPtoEmail error:", err);
      return { success: false };
    }
  },

  logout: async () => {
    return await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });
  },

  changePassword: async (data) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token missing.");
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      throw new Error("Network error. Please check your internet connection.");
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Unexpected server response.");
    }

    if (!response.ok) {
      if (response.status === 422 && result.errors) {
        const firstError = Object.values(result.errors)[0][0];
        throw new Error(firstError);
      }

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      throw new Error(result.message || "Something went wrong.");
    }

    return result;
  },

  verifyDrivingLicense: async ({ dlNumber, dob }) => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE_URL}/api/verify-driving-license`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dl_number: dlNumber, dob }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || "DL verification failed",
        };
      }

      return data;
    } catch (err) {
      return { success: false, message: err.message || "Something went wrong" };
    }
  },

  verifyVehicle: async ({ vehicle_type, vehicle_rc_number }) => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE_URL}/api/verify-vehicle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicle_type, vehicle_rc_number }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || "Vehicle verification failed",
        };
      }

      return data;
    } catch (err) {
      return { success: false, message: err.message || "Something went wrong" };
    }
  },
};
