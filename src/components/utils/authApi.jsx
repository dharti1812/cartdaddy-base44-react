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


  sendOTPtoMobile: async (phone, name, userCode, address) => {
    const res = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, userCode, address  }),
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


  sendOTPtoEmail: async (email, phone, userCode, address) => {
    console.log("🔍 Sending email OTP to:", email, "for phone:", phone);
    try {
      const res = await fetch(`${API_BASE_URL}/api/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, userCode, address }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      return await res.json();
    } catch (err) {
      console.error("❌ sendOTPtoEmail error:", err);
      return { success: false };
    }
  },

  verifyOTPtoEmail: async (email, phone, email_otp, userType, address) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, email_otp, userType, address }),
      });
      if (!res.ok) throw new Error("Failed to verify OTP");
      return await res.json();
    } catch (err) {
      console.error("❌ verifyOTPtoEmail error:", err);
      return { success: false };
    }
  },

  verifyDrivingLicense: async (dlNumber, dob, vehicle_type) => {
    try {
      const token = sessionStorage.getItem("access_token");
      console.log("🔍 Verifying DL:", dlNumber, dob, vehicle_type)  ;
      const res = await fetch(`${API_BASE_URL}/api/verify-driving-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
        body: JSON.stringify({
          dl_number: dlNumber,
          dob,
          vehicle_type
        }),
      });

      if (!res.ok) throw new Error("Failed to verify Driving License");
      return await res.json();
    } catch (err) {
      console.error("❌ verifyDrivingLicense error:", err);
      return { success: false, message: err.message };
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
 

};
