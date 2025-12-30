import React, { useState, useEffect } from "react";
import { DeliveryPartner, Retailer, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE_URL } from "@/config";
import {
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
  LogOut,
  Package,
  Bike,
} from "lucide-react";
import { AuthApi } from "@/components/utils/authApi";
import { createPageUrl } from "@/utils";
import { UserApi } from "@/components/utils/userApi";

export default function DeliveryPartnerOnboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [deliveryPartner, setDeliveryPartner] = useState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpStored, setOtpStored] = useState("");

  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    phone: "",
    email: "",
    alternatePhones: [{ number: "", label: "secondary" }],
    driving_license: "",
    dob: "",
    vehicle_type: "2_wheeler",
    vehicle_number: "",
    vehicle_rc_number: "",
    account_number: "",
    ifsc: "",
    account_holder_name: "",
    bank_name: "",
    selfie_url: "",
    selfie_location: null,
    documents: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1️⃣ Get current logged-in user
      const user = await User.me();
      setCurrentUser(user);

      // 2️⃣ Get all delivery partners
      const partners = await DeliveryPartner.list();

      const userEmail = (user?.email || user?.email || "")
        .toString()
        .trim()
        .toLowerCase();
      const userPhone = (user?.phone || "").toString().replace(/\D/g, "");

      const myPartner = partners.find((p) => {
        const pEmail = (p?.email || p?.email || "")
          .toString()
          .trim()
          .toLowerCase();
        const pPhone = (p?.phone || "").toString().replace(/\D/g, "");
        return (
          (userEmail && pEmail === userEmail) ||
          (userPhone && pPhone === userPhone)
        );
      });

      if (!myPartner) {
        console.warn("No delivery partner found for current user", {
          userEmail,
          userPhone,
        });
        setLoading(false);
        return;
      }

      setDeliveryPartner(myPartner);

      setFormData({
        full_name: myPartner.full_name || "",
        address: myPartner.address || "",
        phone: myPartner.phone || "",
        email: myPartner.email || user.email || "",
        alternatePhones: myPartner.alternate_phones || [
          { number: "", label: "secondary" },
        ],
        driving_license: myPartner.driving_license || "",
        dob: myPartner.dob || "",
        vehicle_type: myPartner.vehicle_type || "2_wheeler",
        vehicle_number: myPartner.vehicle_number || "",
        vehichle_rc_number: myPartner.vehicle_rc_number || "",
        account_number: myPartner.bank_account?.account_number || "",
        ifsc: myPartner.bank_account?.ifsc || "",
        account_holder_name: myPartner.bank_account?.account_holder_name || "",
        bank_name: myPartner.bank_account?.bank_name || "",
        selfie_url: myPartner.selfie_url || "",
        selfie_location: myPartner.selfie_location || null,
        documents: myPartner.documents || [],
      });

      // 7️⃣ Determine current onboarding step
      if (!myPartner.phone_verified) setStep(1);
      else if (!myPartner.email_verified) setStep(2);
      else if (!myPartner.driving_license_verified) setStep(3);
      else if (!myPartner.bank_verified) setStep(4);
      else if ((myPartner.documents?.length || 0) < 4) setStep(5);
      else if (!myPartner.selfie_url) setStep(6);
      else setStep(7);

      setLoading(false);
    } catch (error) {
      setError(error.message || "Failed to load delivery partner data");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await User.logout();

    window.location.reload();
  };

  // Phone OTP
  const handleSendPhoneOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    const phone = formData.phone;
    const name = formData.full_name || "Delivery Partner";
    const address = formData.address;
    const user_type = "delivery_boy";

    setSaving(true);

    const result = await AuthApi.sendOTPtoMobile(
      phone,
      name,
      user_type,
      address
    );

    if (result.success) {
      setOtpStored(result.otp);
      setOtpSent(true);
      setSuccess("OTP sent to your phone via SMS and WhatsApp!");
    } else {
      setError("Failed to send OTP. Please try again.");
    }
    setSaving(false);
  };

  const handleVerifyPhoneOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setSaving(true);
    try {
      const result = await AuthApi.verifyOTP(
        formData.phone,
        otp,
        "delivery_boy"
      );
      if (result.success) {
        setSuccess("✅ Phone verified successfully!");
        setOtp("");
        setOtpSent(false);
        if (result.access_token) {
          localStorage.setItem("access_token", result.access_token);
          sessionStorage.setItem("access_token", result.access_token);
        }
        const nextStep = await UserApi.deliveryBoyOnboardingStatus(
          formData.phone,
          "delivery_boy"
        );
        setStep(nextStep.data.deliveryboy_onboarding_step);
      } else {
        setError("❌ " + (result.message || "Invalid OTP"));
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("❌ Failed to verify OTP. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // Email OTP
  const handleSendEmailOTP = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      const result = await AuthApi.sendOTPtoEmail(
        formData.email,
        formData.phone,
        "delivery_boy",
        formData.address
      );

      // Always show the OTP field even if result.success is false
      setEmailOtpSent(true);

      if (result.success) {
        setOtpStored(result.otp);
        setSuccess("✅ OTP sent to your email!");
      } else {
        setError("⚠️ Failed to send OTP. Please check API or email setup.");
      }
    } catch (err) {
      setError("❌ Something went wrong while sending OTP.");
    }
    setSaving(false);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // front camera for selfie
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const capturePhoto = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Try to get location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Now capture the selfie
        const video = document.getElementById("selfie-video");
        if (!video) {
          alert("Camera not started yet!");
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const photoBase64 = canvas.toDataURL("image/jpeg", 0.9);

        setFormData({
          ...formData,
          selfie_url: photoBase64,
          latitude,
          longitude,
        });

        closeCamera();
      },
      (error) => {
        console.error(error);
        alert(
          "Location access is required to take a selfie. Please enable location in your browser settings."
        );
      },
      { enableHighAccuracy: true }
    );
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const handleVerifyEmailOTP = async () => {
    setSaving(true);
    const result = await AuthApi.verifyOTPtoEmail(
      formData.email,
      formData.phone,
      emailOtp,
      "delivery_boy",
      formData.address
    );

    if (result.success) {
      setSuccess("✅ Email verified successfully!");
      const nextStep = await UserApi.deliveryBoyOnboardingStatus(
        formData.phone,
        "delivery_boy"
      );
      setStep(nextStep.data.deliveryboy_onboarding_step);
    } else {
      setError("❌ Invalid OTP. Please try again.");
    }
    setSaving(false);
  };

  const handleVerifyDL = async () => {
    setError("");
    setSuccess("");

    if (!formData.driving_license || formData.driving_license.length < 10) {
      setError("Please enter a valid Driving License number");
      return;
    }

    if (!formData.dob) {
      setError("Please enter your Date of Birth");
      return;
    }

    setSaving(true);

    try {
      const result = await AuthApi.verifyDrivingLicense({
        dlNumber: formData.driving_license,
        dob: formData.dob,
      });

      if (result.success) {
        setSuccess("✅ Driving License Verified Successfully");
        const nextStep = await UserApi.deliveryBoyOnboardingStatus(
          result.phone,
          "delivery_boy"
        );
        setStep(nextStep.data.deliveryboy_onboarding_step);
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while verifying Driving License");
    }

    setSaving(false);
  };

  const handleVerifyVehicle = async () => {
    setError("");
    setSuccess("");

    if (!formData.vehicle_type) {
      setError("Please select vehicle type");
      return;
    }

    if (!formData.vehicle_rc_number || formData.vehicle_rc_number.length < 5) {
      setError("Please enter a valid Vehicle RC number");
      return;
    }

    setSaving(true);

    try {
      const result = await AuthApi.verifyVehicle({
        vehicle_type: formData.vehicle_type,
        vehicle_rc_number: formData.vehicle_rc_number,
      });

      if (result.success) {
        const vehicleNumberFromRC =
          result.vehicle_number || formData.vehicle_rc_number;

        setFormData({
          ...formData,
          vehicle_number: vehicleNumberFromRC,
        });

        setSuccess("✅ Vehicle Verified Successfully!");
        const nextStep = await UserApi.deliveryBoyOnboardingStatus(
          result.phone,
          "delivery_boy"
        );
        setStep(nextStep.data.deliveryboy_onboarding_step);
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while verifying vehicle");
    }

    setSaving(false);
  };

  // Bank Verification
  const handleVerifyBank = async () => {
    if (!formData.account_number || !formData.ifsc) {
      setError("Please enter both account number and IFSC code");
      return;
    }

    if (formData.ifsc.length !== 11) {
      setError("IFSC code must be exactly 11 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("User not authenticated");

      const response = await fetch(
        `${API_BASE_URL}/api/delivery-partner/verifyacno`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            acno: formData.account_number,
            ifsc: formData.ifsc,
          }),
        }
      );
      console.log(response);
      // check HTTP status first
      if (!response.ok) {
        const errorText = await response.text(); // read body once
        console.error("API returned error:", errorText);
        throw new Error(`API returned status ${response.status}`);
      }

      // safely parse JSON only once
      let result;
      try {
        result = await response.json();
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        throw new Error("Invalid response from server");
      }

      if (result?.verified) {
        const accountHolderName = result.bank_info?.account_holder_name || "";
        const bankName = result.bank_info?.bank_name || "";

        setFormData({
          ...formData,
          account_holder_name: accountHolderName,
          bank_name: bankName,
        });

        setSuccess("✅ Bank account verified successfully!");
        const nextStep = await UserApi.deliveryBoyOnboardingStatus(
          result.phone,
          "delivery_boy"
        );
        setStep(nextStep.data.deliveryboy_onboarding_step);
      } else {
        setError(result?.message || "❌ Invalid bank details");
      }
    } catch (err) {
      console.error("Bank verification error:", err);
      setError(err.message || "❌ Something went wrong during verification");
    } finally {
      setSaving(false);
    }
  };

  // Document Upload
  const handleDocUpload = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1];

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/kyc-documents-upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              image: base64Image,
              filename: file.name,
              document_type: documentType,
            }),
          }
        );

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("Unexpected response:", text);
          alert("Server error. Check console for details.");
          return;
        }

        if (data.result) {
          setFormData((prev) => ({
            ...prev,
            [documentType]: data.upload_id,
          }));
        } else {
          alert("Upload failed: " + data.message);
        }
      } catch (error) {
        console.error("Error uploading:", error);
        alert("Error uploading document. See console.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const submitDocs = async () => {
    if (
      !formData.dl_front ||
      !formData.pan ||
      !formData.aadhar_front ||
      !formData.aadhar_back ||
      !formData.vehicle_rc
    ) {
      alert("Please upload all KYC documents before continuing.");
      return;
    }

    setSaving(true);

    try {
      const res = await UserApi.deliveryBoyOnboardingStatus(
        formData.phone,
        "delivery_boy"
      );

      console.log("Onboarding API response:", res);

      if (!res?.data?.deliveryboy_onboarding_step) {
        throw new Error("Invalid response from server");
      }

      setStep(res.data.deliveryboy_onboarding_step);
    } catch (err) {
      console.error("Submit docs error:", err);
      alert(err.message || "Failed to update onboarding step");
    } finally {
      setSaving(false);
    }
  };

  const resendPhoneOtp = async () => {
    if (!formData.phone) return setError("Enter mobile number first");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/resend-otp-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          user_type: "delivery_boy",
        }),
      });

      const res = await response.json();

      if (res.success === true) {
        setSuccess("OTP resent successfully 🎉");
      } else {
        setError(res.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.log(err);
      setError("Something went wrong while resending OTP");
    }

    setLoading(false);
  };

  // Selfie Upload
  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const accessToken = localStorage.getItem("access_token");
        const base64Image = reader.result.split(",")[1];
        const res = await fetch(`${API_BASE_URL}/api/selfie-upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ image: base64Image, filename: file.name }),
        });
        const data = await res.json();

        if (data.result) {
          setFormData((prev) => ({ ...prev, selfie_url: data.path }));
          localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.setItem("user", JSON.stringify(data.user));
        } else {
          alert(data.message || "Selfie upload failed");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Error uploading selfie");
    } finally {
      setUploading(false);
    }
  };

  const submitSelfie = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!formData.selfie_url) return alert("Upload selfie first");

    try {
      setUploading(true);

      const response = await fetch(`${API_BASE_URL}/api/selfie-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image: formData.selfie_url,
          filename: "selfie.png",
          type: "db_selfie",
          selfie_location: formData.latitude + "," + formData.longitude,
        }),
      });

      const result = await response.json();

      if (!result.result) {
        alert("Upload failed: " + result.message);
        return;
      }

      setFormData({
        ...formData,
        selfie_url: result.path,
        selfie_id: result.selfie_url,
      });

      const nextStep = await UserApi.deliveryBoyOnboardingStatus(
        result.phone,
        "delivery_boy"
      );
      setStep(nextStep.data.deliveryboy_onboarding_step);
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhone = () => {
    if (formData.alternatePhones.length >= 1) return;
    setFormData({
      ...formData,
      alternatePhones: [
        ...formData.alternatePhones,
        { number: "", label: "secondary", otpSent: false, verified: false },
      ],
    });
  };

  const handleRemovePhone = (index) => {
    const updatedPhones = formData.alternatePhones.filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      alternatePhones: updatedPhones,
    });
  };

  const sendAlternateOTP = async (phone) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      console.log(accessToken);
      const response = await fetch(
        `${API_BASE_URL}/api/send-otp/additional-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            phone,
            role: "staff",
            user_type: "delivery_boy",
          }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return { success: false, message: "Network error while sending OTP" };
    }
  };

  const verifyAlternateOTP = async (phone, otp) => {
    try {
      const access_token = localStorage.getItem("access_token");
      console.log(access_token);
      const res = await fetch(
        `${API_BASE_URL}/api/verify-otp/additional-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ phone, otp, user_type: "delivery_boy" }),
        }
      );
      return await res.json();
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to verify OTP" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const goBack = () => {
    switch (step) {
      case 2:
        setStep(1);
        break;
      case 3:
        setStep(2);
        break;
      case 4:
        setStep(3);
        break;
      case 5:
        setStep(4);
        break;

      case 6:
        setStep(5);
        break;
      case 7:
        setStep(6);
        break;
      default:
        break;
    }
  };

  const BackButton = () => {
    if (step === 1) return null;
    return (
      <div className="flex justify-center mt-6">
        <Button variant="outline" className="px-8" onClick={goBack}>
          ⬅ Back
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4 font-sans">
      <Card className="max-w-md w-full border-4 border-[#FFEB3B] shadow-2xl">
        <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg border-b-4 border-[#FFEB3B] p-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
              alt="Cart Daddy"
              className="h-16"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                (window.location.href = createPageUrl("DeliveryBoyLogin"))
              }
              className="border-2 border-[#FFEB3B] text-[#FFEB3B] hover:bg-[#FFEB3B] hover:text-black font-bold text-base"
            >
              Login
            </Button>
          </div>
          <CardTitle className="text-3xl font-extrabold flex items-center justify-center gap-2 mb-2">
            <Bike className="w-8 h-8 text-[#FFEB3B]" />
            Delivery Partner Onboarding
          </CardTitle>
          <p className="text-white text-base">Step {step} of 7</p>
        </CardHeader>

        <CardContent className="p-8 bg-white">
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-500">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-500">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Phone Verification */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Phone className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">Your Details</h3>
              </div>

              {/* FULL NAME */}
              <div>
                <Label className="text-black">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="As per Driving License"
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <Label className="text-black">Current Address *</Label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Your current address"
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B] w-full rounded-md p-2"
                  rows={2}
                />
              </div>

              {/* PHONE */}
              <div>
                <Label className="text-black">Phone Number *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91XXXXXXXXXX"
                  disabled={otpSent}
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              {!otpSent ? (
                // SEND OTP BUTTON
                <Button
                  onClick={handleSendPhoneOTP}
                  disabled={saving}
                  className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
                >
                  {saving ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                // SHOW OTP FIELD + VERIFY + RESEND
                <div className="space-y-3">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg border-2 border-[#075E66] focus:border-[#FFEB3B]"
                  />

                  {/* VERIFY OTP */}
                  <Button
                    onClick={handleVerifyPhoneOTP}
                    disabled={saving || otp.length !== 6}
                    className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66]"
                  >
                    {saving ? "Verifying..." : "Verify OTP"}
                  </Button>

                  {/* RESEND OTP */}
                  <Button
                    variant="outline"
                    disabled={loading}
                    onClick={resendPhoneOtp}
                    className="w-full border-2 border-[#075E66] text-[#075E66] font-semibold"
                  >
                    {loading ? "Resending..." : "Resend OTP"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Mail className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">
                  Email Verification
                </h3>
              </div>

              <div>
                <Label className="text-black">Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  disabled={emailOtpSent}
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              {!emailOtpSent ? (
                <Button
                  onClick={handleSendEmailOTP}
                  disabled={saving}
                  className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
                >
                  {saving ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg border-2 border-[#075E66] focus:border-[#FFEB3B]"
                  />
                  <Button
                    onClick={handleVerifyEmailOTP}
                    disabled={saving || emailOtp.length !== 6}
                    className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66]"
                  >
                    {saving ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              )}
              <BackButton />
            </div>
          )}

          {/* Step 3: Driving License */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">
                  Driving License Verification
                </h3>
              </div>

              <div>
                <Label className="text-black">Driving License Number *</Label>
                <Input
                  value={formData.driving_license}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      driving_license: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="DL Number"
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              <div>
                <Label className="text-black">Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              <Button
                onClick={handleVerifyDL}
                disabled={saving}
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Verifying..." : "Verify Driving License"}
              </Button>

              <BackButton />
            </div>
          )}

          {step === 3.5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">
                  Vehicle Verification
                </h3>
              </div>

              <div>
                <Label className="text-black">Vehicle Type *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={
                      formData.vehicle_type === "2_wheeler"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setFormData({ ...formData, vehicle_type: "2_wheeler" })
                    }
                    className={`h-auto py-4 ${
                      formData.vehicle_type === "2_wheeler"
                        ? "bg-[#FFEB3B] text-black border-2 border-[#075E66]"
                        : "border-2 border-[#075E66] text-black"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-2xl mb-1">🏍️</p>
                      <p className="font-bold">2-Wheeler</p>
                      <p className="text-xs opacity-75">Bike/Scooter</p>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={
                      formData.vehicle_type === "4_wheeler"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setFormData({ ...formData, vehicle_type: "4_wheeler" })
                    }
                    className={`h-auto py-4 ${
                      formData.vehicle_type === "4_wheeler"
                        ? "bg-[#FFEB3B] text-black border-2 border-[#075E66]"
                        : "border-2 border-[#075E66] text-black"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-2xl mb-1">🚗</p>
                      <p className="font-bold">4-Wheeler</p>
                      <p className="text-xs opacity-75">Car/Van</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-black">Vehicle Number *</Label>
                <Input
                  value={formData.vehicle_rc_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicle_rc_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Enter RC Number"
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>

              <Button
                onClick={handleVerifyVehicle}
                disabled={saving}
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Verifying..." : "Verify Vehicle"}
              </Button>

              <BackButton />
            </div>
          )}

          {/* Step 4: Bank Details */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CreditCard className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">Bank Account</h3>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  We'll verify your bank account using Cashfree for secure
                  payouts.
                </AlertDescription>
              </Alert>
              <div>
                <Label className="text-black">Account Number *</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  placeholder="XXXXXXXXXXXXXXXX"
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>
              <div>
                <Label className="text-black">IFSC Code *</Label>
                <Input
                  value={formData.ifsc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ifsc: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="XXXX0XXXXXX"
                  maxLength={11}
                  className="border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>
              <Button
                onClick={handleVerifyBank}
                disabled={saving}
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Verifying..." : "Verify & Continue"}
              </Button>
              <BackButton />
            </div>
          )}

          {/* Step 5: Documents Upload */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">KYC Documents</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: "dl_front", label: "Driving License (Front)" },
                  { key: "pan", label: "PAN Card" },
                  { key: "aadhar_front", label: "Aadhaar (Front)" },
                  { key: "aadhar_back", label: "Aadhaar (Back)" },
                  { key: "vehicle_rc", label: "Vehicle RC" },
                ].map((doc) => (
                  <div key={doc.key}>
                    <Label className="text-black">{doc.label} *</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDocUpload(e, doc.key)}
                      disabled={uploading || formData[doc.key]}
                      className="border-2 border-[#075E66]"
                    />
                    {formData[doc.key] && (
                      <p className="text-xs text-green-600 mt-1">✅ Uploaded</p>
                    )}
                  </div>
                ))}
              </div>

              {uploading && (
                <p className="text-sm text-blue-600 text-center">
                  Uploading...
                </p>
              )}

              <Button
                onClick={submitDocs}
                disabled={
                  saving ||
                  uploading ||
                  !formData.dl_front ||
                  !formData.pan ||
                  !formData.aadhar_front ||
                  !formData.aadhar_back ||
                  !formData.vehicle_rc
                }
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Saving..." : "Continue to Selfie"}
              </Button>
              <BackButton />
            </div>
          )}

          {/* Step 6: Selfie + Contact Numbers */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <Camera className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">
                  Selfie & Additional Mobile Number
                </h3>
              </div>

              {/* Additional Mobile Number */}
              <div className="space-y-3">
                <Label>Additional Mobile Number (Optional)</Label>
                <p className="text-xs text-gray-500">Add 1 more number</p>

                {formData.alternatePhones.map((phone, index) => (
                  <div
                    key={index}
                    className="space-y-2 border p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="+91XXXXXXXXXX"
                        value={phone.number}
                        onChange={(e) => {
                          const updated = [...formData.alternatePhones];
                          updated[index].number = e.target.value;
                          setFormData({
                            ...formData,
                            alternatePhones: updated,
                          });
                        }}
                        className="flex-1"
                        disabled={phone.verified}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePhone(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {/* OTP Section */}
                    {!phone.otpSent && !phone.verified && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!phone.number)
                            return alert("Enter mobile number first");
                          setUploading(true);
                          const res = await sendAlternateOTP(
                            phone.number,
                            phone.label
                          );
                          setUploading(false);
                          if (res.success) {
                            const updated = [...formData.alternatePhones];
                            updated[index].otpSent = true;
                            setFormData({
                              ...formData,
                              alternatePhones: updated,
                            });
                            alert(`✅ OTP sent to ${phone.number}`);
                          } else {
                            alert(res.message || "Failed to send OTP");
                          }
                        }}
                        className="bg-[#F4B321] text-gray-900 w-full"
                        disabled={uploading}
                      >
                        {uploading ? "Sending..." : "Send OTP"}
                      </Button>
                    )}

                    {phone.otpSent && !phone.verified && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter OTP"
                          maxLength={6}
                          value={phone.otp || ""}
                          onChange={(e) => {
                            const updated = [...formData.alternatePhones];
                            updated[index].otp = e.target.value;
                            setFormData({
                              ...formData,
                              alternatePhones: updated,
                            });
                          }}
                          className="text-center text-lg"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#F4B321] text-gray-900"
                            onClick={async () => {
                              if (!phone.otp)
                                return alert("Enter OTP to verify number");
                              setUploading(true);
                              const res = await verifyAlternateOTP(
                                phone.number,
                                phone.otp
                              );
                              setUploading(false);
                              if (res.success) {
                                const updated = [...formData.alternatePhones];
                                updated[index].verified = true;
                                setFormData({
                                  ...formData,
                                  alternatePhones: updated,
                                });
                                alert(
                                  `✅ ${phone.number} verified successfully`
                                );
                              } else {
                                alert(res.message || "Invalid OTP");
                              }
                            }}
                            disabled={uploading}
                          >
                            {uploading ? "Verifying..." : "Verify OTP"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await sendAlternateOTP(phone.number);
                              if (res.success) {
                                alert(`OTP resent to ${phone.number}`);
                              } else {
                                alert(res.message || "Failed to resend OTP");
                              }
                            }}
                          >
                            Resend OTP
                          </Button>
                        </div>
                      </div>
                    )}

                    {phone.verified && (
                      <Badge className="bg-green-600 text-white text-xs">
                        ✅ Verified
                      </Badge>
                    )}
                  </div>
                ))}

                {formData.alternatePhones.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhone}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Number
                  </Button>
                )}
              </div>

              {/* Selfie Upload */}
              <div>
                <Label>Upload Your Selfie *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Take a clear selfie with your face visible
                </p>
                {!formData.selfie_url && !isCameraOpen ? (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      className="w-full bg-blue-600 text-white"
                      onClick={openCamera}
                    >
                      Open Camera
                    </Button>
                  </div>
                ) : formData.selfie_url ? (
                  <div className="relative">
                    <img
                      src={formData.selfie_url}
                      alt="Selfie"
                      className="w-full h-64 object-cover rounded border-4 border-[#FFEB3B]"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                      ✅ Uploaded
                    </Badge>
                  </div>
                ) : null}

                {formData.selfie_url && (
                  <Button
                    type="button"
                    className="w-full bg-yellow-500 mt-2"
                    onClick={() =>
                      setFormData({ ...formData, selfie_url: null })
                    }
                  >
                    Retake / Change Selfie
                  </Button>
                )}

                {/* Camera Modal */}
                {isCameraOpen && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-xl">
                      <video
                        id="selfie-video"
                        autoPlay
                        className="w-80 rounded"
                        ref={(video) =>
                          video && (video.srcObject = cameraStream)
                        }
                      />
                      <div className="flex gap-3 mt-3">
                        <Button
                          className="bg-green-600 flex-1"
                          onClick={capturePhoto}
                        >
                          Capture
                        </Button>
                        <Button
                          className="bg-red-600 flex-1"
                          onClick={closeCamera}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                )}
              </div>

              <Button
                onClick={submitSelfie}
                disabled={
                  uploading ||
                  !formData.selfie_url ||
                  formData.alternatePhones.some(
                    (p) => p.number.trim() && !p.verified
                  )
                }
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {uploading ? "Submitting..." : "Continue to Complete"}
              </Button>

              <BackButton />
            </div>
          )}

          {/* Step 7: Seller Selection - redirect to main flow */}
          {step === 7 && (
            <div className="text-center py-8">
              <CheckCircle className="w-20 h-20 text-[#075E66] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-black">
                Basic Verification Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                The sign up process is complete and you will be notified once it
                is approved.
              </p>
              <BackButton />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
