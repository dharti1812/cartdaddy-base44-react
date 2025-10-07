
/**
 * SARV SMS API Integration
 * 
 * ISSUE: Backend function returning 500 error
 * SOLUTION: Using TEST MODE with bypass OTP until backend is fixed
 */

export const getSarvConfig = () => {
  return {
    useBackend: false, // Disable backend for now
    isConfigured: true,
    testMode: true, // TEST MODE ENABLED
    bypassOTP: "123456" // Use this OTP for testing
  };
};

/**
 * Send Mobile Verification OTP - TEST MODE
 */
export const sendSMSOTP = async (phone) => {
  const config = getSarvConfig();
  
  console.log("📱 SARV SMS OTP REQUEST - TEST MODE");
  console.log("Phone:", phone);
  console.log("Test Mode:", config.testMode);
  
  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone;
  
  // Validate phone number
  if (formattedPhone.length !== 10) {
    return {
      success: false,
      message: "Invalid phone number. Please enter 10-digit mobile number."
    };
  }
  
  // TEST MODE: Return success immediately
  if (config.testMode) {
    console.log("✅ TEST MODE: OTP is", config.bypassOTP);
    
    // Store OTP in session storage
    sessionStorage.setItem(`otp_${formattedPhone}`, config.bypassOTP);
    sessionStorage.setItem(`otp_${formattedPhone}_time`, Date.now().toString());
    
    return {
      success: true,
      message: `✅ TEST MODE: Your OTP is ${config.bypassOTP}`,
      otp: config.bypassOTP,
      testMode: true
    };
  }
  
  // If test mode is off, try backend (will fail for now)
  return {
    success: false,
    message: "Backend SMS service is currently unavailable. Please use test mode."
  };
};

/**
 * Verify OTP against stored OTP
 */
export const verifyOTP = (phone, otp) => {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone;
  
  const storedOTP = sessionStorage.getItem(`otp_${formattedPhone}`);
  const otpTime = sessionStorage.getItem(`otp_${formattedPhone}_time`);
  
  console.log("🔍 Verifying OTP:");
  console.log("  Phone:", formattedPhone);
  console.log("  Entered OTP:", otp);
  console.log("  Stored OTP:", storedOTP);
  
  if (!storedOTP || !otpTime) {
    return { 
      success: false, 
      message: "OTP not found. Please request a new OTP." 
    };
  }
  
  // Check if OTP expired (5 minutes = 300000 ms)
  const otpAge = Date.now() - parseInt(otpTime);
  if (otpAge > 300000) {
    sessionStorage.removeItem(`otp_${formattedPhone}`);
    sessionStorage.removeItem(`otp_${formattedPhone}_time`);
    return { 
      success: false, 
      message: "OTP expired. Please request a new OTP." 
    };
  }
  
  // Verify OTP
  if (otp === storedOTP) {
    // Clear OTP after successful verification
    sessionStorage.removeItem(`otp_${formattedPhone}`);
    sessionStorage.removeItem(`otp_${formattedPhone}_time`);
    
    return { 
      success: true, 
      message: "OTP verified successfully" 
    };
  }
  
  return { 
    success: false, 
    message: "Invalid OTP. Please try again." 
  };
};

/**
 * Send Order OTP
 */
export const sendOrderOTP = async (phone, customerName, orderRef, otp) => {
  const config = getSarvConfig();
  
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone;
  
  if (config.testMode) {
    console.log(`✉️ TEST MODE: Sending order OTP ${otp} to ${formattedPhone} for order ${orderRef}`);
    return { 
      success: true, 
      message: `TEST MODE: Order OTP is ${otp}`,
      otp: otp,
      testMode: true
    };
  }
  
  const message = `Your delivery OTP for Cart Daddy order ${orderRef} is ${otp}. Do not share it with anyone except the delivery executive.`;
  
  // This would call the backend function in production
  // For now, it will fail gracefully if test mode is off
  try {
    const { sendSMSOTP: sendBackendSMS } = await import('@/api/functions');
    const response = await sendBackendSMS({
      phone: formattedPhone,
      message: message
    });
    
    if (response.data.success) {
      return { success: true, message: "Order OTP sent successfully" };
    }
    return { success: false, message: response.data.message };

  } catch(e) {
    console.error("Failed to call backend SMS function:", e);
    return { success: false, message: "Backend SMS service unavailable" };
  }
};

/**
 * Send multi-channel OTP
 */
export const sendMultiChannelOTP = async (phone, channels = ['sms']) => {
  const results = {};
  
  if (channels.includes('sms')) {
    results.sms = await sendSMSOTP(phone);
  }
  
  return {
    success: results.sms?.success || false,
    otp: results.sms?.otp,
    results: results,
    message: results.sms?.message || "Failed to send OTP"
  };
};
