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
import { UploadFile } from "@/api/integrations";
import { sendMultiChannelOTP } from "../components/utils/sarvAPI";
import {
  verifyDrivingLicense,
  verifyBankAccount,
} from "../components/utils/cashfreeConfig";
import { DeliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";

export default function DeliveryPartnerOnboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [deliveryPartner, setDeliveryPartner] = useState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStepState] = useState(() => {
    const savedStep = localStorage.getItem("DeliveryPartnerOnboardingStep");
    return savedStep ? Number(savedStep) : 1;
  });

  const setStep = (s) => {
    setStepState(s);
    localStorage.setItem("DeliveryPartnerOnboardingStep", s);
  };

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpStored, setOtpStored] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    alternatePhones: [{ number: "", label: "secondary" }],
    driving_license: "",
    dob: "",
    vehicle_type: "2_wheeler",
    vehicle_number: "",
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
      console.log("Current User:", user);
      setCurrentUser(user);

      // 2️⃣ Get all delivery partners
      const partners = await DeliveryPartner.list();
      console.log("All Delivery Partners:", partners);

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
      console.log("Current Delivery Partner:", myPartner);

      setFormData({
        full_name: myPartner.full_name || "",
        phone: myPartner.phone || "",
        email: myPartner.email || user.email || "",
        alternatePhones: myPartner.alternate_phones || [
          { number: "", label: "secondary" },
        ],
        driving_license: myPartner.driving_license || "",
        dob: myPartner.dob || "",
        vehicle_type: myPartner.vehicle_type || "2_wheeler",
        vehicle_number: myPartner.vehicle_number || "",
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
      console.error("Error loading data:", error);
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
    const userCode = "D";

    setSaving(true);

    const result = await AuthApi.sendOTPtoMobile(phone, name, userCode);

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
      const result = await AuthApi.verifyOTP(formData.phone, otp);

      if (result.success) {
        setSuccess("✅ Phone verified successfully!");
        setOtp("");
        setOtpSent(false);
        setStep(2);
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
        "D"
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

  const handleVerifyEmailOTP = async () => {
    setSaving(true);
    const result = await AuthApi.verifyOTPtoEmail(
      formData.email,
      formData.phone,
      emailOtp,
      "D"
    );

    if (result.success) {
      setSuccess("✅ Email verified successfully!");
      setStep(3);
      if (result.access_token) {
        sessionStorage.setItem("access_token", result.access_token);
      }
    } else {
      setError("❌ Invalid OTP. Please try again.");
    }
    setSaving(false);
  };

  // DL Verification
  const handleVerifyDL = async () => {
    setError("");
    
    if (!formData.driving_license || formData.driving_license.length < 10) {
      setError("Please enter a valid driving license number");
      return;
    }
    if (!formData.dob) {
      setError("Please enter your Date of Birth");
      return;
    }

    if (!formData.vehicle_type) {
      setError("Please select vehicle type");
      return;
    }

    setSaving(true);

    const result = await AuthApi.verifyDrivingLicense(
      formData.driving_license,
      formData.dob,
      formData.vehicle_type
    );

    if (result.success) {
      setSuccess("✅ Driving License verified successfully!");
      setStep(4);
    } else {
      setError(`❌ ${result.message}`);
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
      setError("IFSC code must be 11 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("User not authenticated");

      const response = await fetch(`${API_BASE_URL}/api/verifyacno`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          acno: formData.account_number,
          ifsc: formData.ifsc,
        }),
      });

      if (!response.ok)
        throw new Error(`API returned status ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error("Empty response from server");

      const result = JSON.parse(text);

      if (result.verified) {
        const accountHolderName = result.data?.account_holder_name || "";
        const bankName = result.data?.bank_name || "";

        await DeliveryPartnerApi.update(deliveryPartner.id, {
          bank_verified: true,
          bank_account: {
            account_number: formData.account_number,
            ifsc: formData.ifsc,
            account_holder_name: accountHolderName,
            bank_name: bankName,
          },
          onboarding_status: "documents_pending",
        });

        setFormData({
          ...formData,
          account_holder_name: accountHolderName,
          bank_name: bankName,
        });

        setSuccess("✅ Bank account verified successfully!");
        setStep(5);
      } else {
        setError(result.message || "❌ Invalid bank details");
      }
    } catch (err) {
      console.error("Bank verification error:", err);
      setError(err.message || "❌ Something went wrong during verification");
    } finally {
      setSaving(false);
    }
  };

  // Document Upload
  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData((prev) => ({
        ...prev,
        documents: [
          ...prev.documents.filter((d) => d.type !== type),
          {
            url: file_url,
            type: type,
            uploaded_at: new Date().toISOString(),
          },
        ],
      }));
    } catch (err) {
      setError("Failed to upload document");
    }
    setUploading(false);
  };

  const submitDocs = async () => {
    if ((formData.documents?.length || 0) < 4) {
      return setError("Please upload all 4 required documents.");
    }
    setSaving(true);
    try {
      await DeliveryPartnerApi.update(deliveryPartner.id, {
        documents: formData.documents,
        onboarding_status: "selfie_pending",
      });
      setSuccess("✅ Documents uploaded successfully!");
      setStep(6);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  // Selfie Upload
  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });

      // Get current location
      const location = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: new Date().toISOString(),
            }),
          () => resolve(null)
        );
      });

      setFormData({
        ...formData,
        selfie_url: file_url,
        selfie_location: location,
      });
    } catch (err) {
      setError("Failed to upload selfie");
    }
    setUploading(false);
  };

  const submitSelfie = async () => {
    if (!formData.selfie_url) {
      setError("Please upload your selfie");
      return;
    }

    setSaving(true);
    try {
      await DeliveryPartnerApi.update(deliveryPartner.id, {
        selfie_url: formData.selfie_url,
        selfie_location: formData.selfie_location,
        alternate_phones: formData.alternatePhones.filter((p) => p.number),
        onboarding_status: "retailers_pending",
      });

      setSuccess("✅ Selfie uploaded! Now select sellers.");
      setStep(7);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleAddPhone = () => {
    if (formData.alternatePhones.length >= 1) return;
    setFormData({
      ...formData,
      alternatePhones: [
        ...formData.alternatePhones,
        { number: "", label: "secondary" },
      ],
    });
  };

  const handleRemovePhone = (index) => {
    setFormData({
      ...formData,
      alternatePhones: formData.alternatePhones.filter((_, i) => i !== index),
    });
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
                <Button
                  onClick={handleSendPhoneOTP}
                  disabled={saving}
                  className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
                >
                  {saving ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg border-2 border-[#075E66] focus:border-[#FFEB3B]"
                  />
                  <Button
                    onClick={handleVerifyPhoneOTP}
                    disabled={saving || otp.length !== 6}
                    className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66]"
                  >
                    {saving ? "Verifying..." : "Verify OTP"}
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
            </div>
          )}

          {/* Step 3: Driving License */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">
                  Driving License & Vehicle
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
                  value={formData.vehicle_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicle_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="MH12XX1234"
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
                {["dl_front", "pan", "aadhaar_front", "vehicle_rc"].map(
                  (docType) => {
                    const doc = formData.documents.find(
                      (d) => d.type === docType
                    );
                    return (
                      <div key={docType}>
                        <Label className="text-black capitalize">
                          {docType.replace("_", " ")} *
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDocUpload(e, docType)}
                          disabled={uploading || !!doc}
                          className="border-2 border-[#075E66]"
                        />
                        {doc && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ Uploaded
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
              {uploading && (
                <p className="text-sm text-blue-600 text-center">
                  Uploading...
                </p>
              )}
              <Button
                onClick={submitDocs}
                disabled={
                  saving || uploading || (formData.documents?.length || 0) < 4
                }
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Saving..." : "Continue to Selfie"}
              </Button>
            </div>
          )}

          {/* Step 6: Selfie + Contact Numbers */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Camera className="w-16 h-16 text-[#075E66] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black">
                  Selfie & Contact Numbers
                </h3>
              </div>

              {/* Additional Contact Number */}
              <div className="space-y-3">
                <Label className="text-black">
                  Additional Contact Number (Optional)
                </Label>
                <p className="text-xs text-gray-500">Add 1 more number</p>
                {formData.alternatePhones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="+91XXXXXXXXXX"
                      value={phone.number}
                      onChange={(e) => {
                        const updated = [...formData.alternatePhones];
                        updated[index].number = e.target.value;
                        setFormData({ ...formData, alternatePhones: updated });
                      }}
                      className="flex-1 border-2 border-[#075E66] focus:border-[#FFEB3B]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhone(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {formData.alternatePhones.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhone}
                    className="w-full border-2 border-[#075E66] text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Number
                  </Button>
                )}
              </div>

              {/* Selfie Upload */}
              <div>
                <Label className="text-black">Upload Your Selfie *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Take a clear selfie with your face visible
                </p>
                {!formData.selfie_url ? (
                  <Input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieUpload}
                    disabled={uploading}
                    className="border-2 border-[#075E66]"
                  />
                ) : (
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
                )}
                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                )}
              </div>

              <Button
                onClick={submitSelfie}
                disabled={saving || !formData.selfie_url}
                className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
              >
                {saving ? "Submitting..." : "Continue to Seller Selection"}
              </Button>
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
                Now select sellers you want to work with
              </p>
              <Button
                onClick={() =>
                  (window.location.href = createPageUrl("DeliveryBoyPortal"))
                }
                className="bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66]"
              >
                Continue to Seller Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
