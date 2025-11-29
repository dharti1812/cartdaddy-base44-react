import { useState, useEffect } from "react";
import { Retailer, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Building2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Store,
  LogOut,
  Camera,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";
import { API_BASE_URL } from "../../src/config";

const sendOTP = async (phone, name) => {
  console.log(`Sending OTP to ${name} at ${phone}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const verifyOTP = async (phone_otp, phone) => {
  console.log(`verifing OTP to ${phone_otp} at ${phone}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_otp, phone }),
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: error.message };
  }
};

const sendAlternateOTP = async (phone, role) => {
  try {
    const access_token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/api/send-otp/additional-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ phone, role }),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// Demo API for verifying OTP
const verifyAlternateOTP = async (phone, otp) => {
  try {
    const access_token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/api/verify-otp/additional-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ phone, otp }),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export default function SellerOnboarding() {
  const [step, setStepState] = useState(() => {
    const savedStep = localStorage.getItem("retailerOnboardingStep");
    return savedStep ? Number(savedStep) : 1;
  });

  // Wrap setStep to also save to localStorage
  const setStep = (s) => {
    setStepState(s);
    localStorage.setItem("retailerOnboardingStep", s);
  };
  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    gst: "",
    alternatePhones: [{ number: "", label: "manager" }],
    bank: { acc: "", ifsc: "" },
    shopPhotos: [],
    documents: [],
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retailer, setRetailer] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await User.me();
      console.log("Current User:", user);
      const allRetailers = await Retailer.list();
      console.log(allRetailers);
      const myRetailers = allRetailers.filter((r) => r.user_id === user.id);

      let currentRetailer = null;

      if (myRetailers.length > 1) {
        const sorted = myRetailers.sort((a, b) => {
          if (
            a.onboarding_status === "approved" &&
            b.onboarding_status !== "approved"
          )
            return -1;
          if (
            b.onboarding_status === "approved" &&
            a.onboarding_status !== "approved"
          )
            return 1;
          return new Date(b.created_date) - new Date(a.created_date);
        });
        const keepAccount = sorted[0];
        const deleteAccounts = sorted.slice(1);
        for (const dup of deleteAccounts) {
          await Retailer.delete(dup.id);
        }
        currentRetailer = keepAccount;
        setRetailer(keepAccount);
      } else if (myRetailers.length === 1) {
        currentRetailer = myRetailers[0];
        setRetailer(myRetailers[0]);
      }

      if (currentRetailer?.onboarding_status === "approved") {
        window.location.href = createPageUrl("RetailerPortal");
      } else if (currentRetailer) {
        setData((prev) => ({
          ...prev,
          name: currentRetailer.full_name || prev.name,
          phone: currentRetailer.phone || prev.phone,
          email: currentRetailer.email || prev.email,
          gst: currentRetailer.gst_number || prev.gst,
          businessName: currentRetailer.business_name || prev.businessName,
          alternatePhones:
            currentRetailer.alternate_phones || prev.alternatePhones,
          bank: currentRetailer.bank_account || prev.bank,
          shopPhotos: currentRetailer.shop_photos || prev.shopPhotos,
          documents: currentRetailer.documents || prev.documents,
        }));
        let nextStep = 1;

        if (!currentRetailer.phone_verified) {
          nextStep = 1; // Phone step
        } else if (!currentRetailer.email_verified) {
          nextStep = 2; // Email step
        } else if (!currentRetailer.gst_verified) {
          nextStep = 3; // GST step
        } else if (!currentRetailer.bank_verified) {
          nextStep = 4; // Bank step
        } else if (
          !currentRetailer.documents?.some((d) => d.type === "pan") ||
          !currentRetailer.documents?.some((d) => d.type === "aadhaar")
        ) {
          nextStep = 5; // KYC documents step
        } else if ((currentRetailer.shop_photos?.length || 0) < 2) {
          nextStep = 6; // Shop photos step
        } else {
          nextStep = 7; // Under review
        }

        setStep(nextStep);
      }
    } catch (e) {
      console.error("Error checking user or retailer:", e);
      setStep(1);
    }
  };

  const handleLogout = async () => {
    await User.logout();
    localStorage.removeItem("retailerOnboardingStep");
    window.location.reload();
  };

  const submitPhone = async () => {
    if (!data.name || !data.phone) return setError("Enter name and mobile");

    const allSellers = await Retailer.list();
    const cleanPhone = data.phone.replace(/\D/g, "");

    const existingSeller = allSellers.find((s) => {
      const sClean = s.phone?.replace(/\D/g, "") || "";
      return (
        sClean === cleanPhone ||
        sClean.endsWith(cleanPhone) ||
        cleanPhone.endsWith(sClean)
      );
    });

    const user = await User.me();

    if (existingSeller && existingSeller.user_id !== user.id) {
      return setError(
        "This mobile number is already registered with another account."
      );
    }

    setLoading(true);
    const otpResponse = await sendOTP(data.phone, data.name);
    if (otpResponse.success) {
      setSuccess("✅ OTP sent to your mobile");
      setStep(1.5);
    } else {
      setError(otpResponse.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const verifyPhone = async () => {
    if (!otp || !data.phone) return setError("Enter OTP and mobile number");
    setLoading(true);

    const result = await verifyOTP(otp, data.phone);

    if (!result.success) {
      setError(result.message || "Wrong OTP");
      setLoading(false);
      return;
    }

    const user = await User.me();

    let r;
    if (retailer) {
      r = await Retailer.update(retailer.id, {
        phone_verified: true,
        onboarding_status: "email_pending",
        full_name: data.name,
      });
    } else {
      r = await Retailer.create({
        user_id: user.id,
        full_name: data.name,
        phone: data.phone,
        phone_verified: true,
        onboarding_status: "email_pending",
      });
    }

    setRetailer(r);
    setSuccess("✅ Mobile verified");
    setOtp("");
    setStep(2);

    setLoading(false);
  };

  const submitEmail = async () => {
    if (!data.email) return setError("Enter email");
    if (!data.phone) return setError("Mobile number not verified");

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, phone: data.phone }), // Pass phone here
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("✅ OTP sent to your email");
        setStep(2.5);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const verifyEmail = async () => {
    if (!otp || !data.phone) return setError("Enter OTP and mobile number");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone, email_otp: otp }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Wrong OTP");
        setLoading(false);
        return;
      }

      await Retailer.update(retailer.id, {
        email: data.email,
        email_verified: true,
        onboarding_status: "gst_pending",
      });

      setSuccess("✅ Email verified");
      setOtp("");
      setStep(3);
      console.log(result);
      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const submitGST = async () => {
    console.log(data);
    if (!data.gst || data.gst.length !== 15)
      return setError("Enter valid 15-digit GST number");
    if (!data.phone) return setError("Mobile Number not verified");

    setLoading(true);
    const access_token = localStorage.getItem("access_token");
    console.log(access_token);

    try {
      const response = await fetch(`${API_BASE_URL}/api/verifygstinweb`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ gstin: data.gst }),
      });

      const result = await response.json();

      if (result.verified) {
        setData({
          ...data,
          businessName: result.trade_name_of_business,
          gstInfo: result,
        });

        setSuccess(
          "✅ GST verified - Business: " + result.trade_name_of_business
        );

        // Update retailer frontend state
        setRetailer((prev) => ({
          ...prev,
          gst_number: data.gst,
          business_name: result.trade_name_of_business,
          gst_verified: true,
          gst_verification_data: result,
          onboarding_status: "bank_pending",
        }));

        setStep(4); // move to bank step
      } else {
        setError(result.message || "GSTIN verification failed");
      }
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  const submitBank = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
          acno: data.bank.acc,
          ifsc: data.bank.ifsc,
        }),
      });

      const result = await response.json();

      if (result.verified) {
        // Update frontend state
        setRetailer((prev) => ({
          ...prev,
          bank_account: data.bank,
          bank_verified: true,
          onboarding_status: "docs_pending",
        }));

        setSuccess("✅ Bank verified successfully");
        setStep(5);
      } else {
        setError(result.message || "Invalid bank details");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhone = () => {
    if (data.alternatePhones.length >= 2) return;
    setData({
      ...data,
      alternatePhones: [
        ...data.alternatePhones,
        { number: "", label: "staff" },
      ],
    });
  };

  const handleRemovePhone = (index) => {
    setData({
      ...data,
      alternatePhones: data.alternatePhones.filter((_, i) => i !== index),
    });
  };

  const handleDocUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          file, // store actual File object
          type: type,
          uploaded_at: new Date().toISOString(),
        },
      ],
    }));
  };

  const submitPan = async () => {
    if (!data.panNumber || !data.panName) {
      return setError("Please enter both PAN number and name");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const access_token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-pan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`, // <-- add this
        },
        body: JSON.stringify({
          pan: data.panNumber,
          name: data.panName,
        }),
      });

      const result = await res.json();
      console.log(result);

      if (result.success) {
        console.log(result);
        setSuccess("✅ PAN verified successfully");
        setStep(5.5); // proceed to Aadhaar verification
      } else {
        setError(result.message || "PAN verification failed");
      }
    } catch (err) {
      setError(err.message || "Server error");
    }

    setLoading(false);
  };

  const submitAadhaar = async () => {
    if (!data.aadhaarNumber)
      return setError("Please enter your Aadhaar number");

    setLoading(true);
    setError("");
    setSuccess("");

    const access_token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_BASE_URL}/api/aadhaar/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ aadhaar: data.aadhaarNumber }),
      });

      const result = await res.json();

      if (result.success) {
        setSuccess("✅ OTP sent successfully to your registered mobile number");
        // Store ref_id for next step
        setData({ ...data, refId: result.ref_id });
        // Move to OTP verification step (step 6)
        setStep(5.6);
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Server error");
    }

    setLoading(false);
  };

  const verifyAadhaarOTP = async () => {
    console.log(data);
    if (!data.aadhaarOTP || !data.refId)
      return setError("Please enter the OTP received on your mobile");

    setLoading(true);
    setError("");
    setSuccess("");

    const access_token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_BASE_URL}/api/aadhaar/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          otp: data.aadhaarOTP,
          ref_id: data.refId,
        }),
      });

      const result = await res.json();
      console.log(result);
      if (result.success) {
        setSuccess("✅ Aadhaar verified successfully");
        setStep(6); // Move to next process step
      } else {
        setError(result.message || "Aadhaar verification failed");
      }
    } catch (err) {
      setError(err.message || "Server error");
    }

    setLoading(false);
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not logged in");

      // Convert file to base64
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result.split(",")[1]); // remove prefix
          reader.onerror = (error) => reject(error);
        });

      const base64File = await toBase64(file);

      const formData = {
        image: base64File,
        filename: file.name,
        type, // "inside" or "outside"
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        timestamp: location?.timestamp || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/image-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.result) {
        // Optional: Get location from geolocation
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

        setData((prev) => ({
          ...prev,
          shopPhotos: [
            ...prev.shopPhotos,
            {
              url: result.path, // URL returned by your Laravel API
              type: type,
              location: location,
              manually_verified: false,
            },
          ],
        }));

        setSuccess("✅ Photo uploaded successfully!");
      } else {
        setError(result.message || "Failed to upload photo");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error uploading photo");
    }

    setUploading(false);
  };

  const submitPhotos = async () => {
    if (data.shopPhotos.length < 2) {
      return setError(
        "Please upload at least 2 shop photos (outside + inside)"
      );
    }
    const access_token = localStorage.getItem("access_token");
    setLoading(true);
    try {
      // Call your Laravel API
      const response = await fetch(`${API_BASE_URL}/api/store-shop-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          alternate_phones: data.alternatePhones.filter((p) => p.number),
          shop_photos: data.shopPhotos,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("✅ Application submitted for approval!");
        setStep(7);
      } else {
        setError(result.message || "Failed to submit application");
      }
    } catch (e) {
      console.error(e);
      setError("Server error while submitting application");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-white border-b-4 border-[#F4B321]">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
                className="h-12"
              />
              <div>
                <CardTitle>Seller Registration</CardTitle>
                <p className="text-sm text-gray-600">
                  Step {Math.floor(step)} of 7
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {retailer && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout from seller profile"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </Button>
              )}
              {!retailer && (
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = createPageUrl("RetailerLogin"))
                  }
                >
                  Login
                </Button>
              )}
            </div>
          </div>
          <Progress value={(Math.floor(step) / 7) * 100} className="mt-4 h-3" />
        </CardHeader>

        <CardContent className="p-8">
          {error && (
            <Alert className="mb-4 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Phone className="w-16 h-16 text-[#F4B321] mx-auto mb-4" />
                <h3 className="text-2xl font-bold">Your Details</h3>
              </div>
              <div>
                <Label>Proprietor/Partner/Director Name *</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Owner/Manager Name"
                />
              </div>
              <div>
                <Label>Mobile *</Label>
                <Input
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
              <Button
                onClick={submitPhone}
                disabled={loading}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Sending..." : "sendOTP"}
              </Button>
            </div>
          )}

          {step === 1.5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold">Verify Mobile</h3>
              </div>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                className="text-center text-lg"
              />
              <Button
                onClick={verifyPhone}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#F4B321] text-gray-900 font-bold"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">Email</h3>
              </div>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="your@email.com"
              />
              <Button
                onClick={submitEmail}
                disabled={loading}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          )}

          {step === 2.5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold">Verify Email</h3>
              </div>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                className="text-center text-lg"
              />
              <Button
                onClick={verifyEmail}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#F4B321] text-gray-900 font-bold"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">GST Details</h3>
              </div>
              <div>
                <Label>GST Number *</Label>
                <Input
                  value={data.gst}
                  onChange={(e) =>
                    setData({ ...data, gst: e.target.value.toUpperCase() })
                  }
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your business name will be auto-verified from GST records
                </p>
              </div>
              <Button
                onClick={submitGST}
                disabled={loading}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Verifying GST..." : "Verify GST"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">Bank Details</h3>
              </div>
              {data.businessName && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Business Name:</strong> {data.businessName}
                  </AlertDescription>
                </Alert>
              )}
              <Input
                value={data.bank.acc}
                onChange={(e) =>
                  setData({
                    ...data,
                    bank: { ...data.bank, acc: e.target.value },
                  })
                }
                placeholder="Account Number"
              />
              <Input
                value={data.bank.ifsc}
                onChange={(e) =>
                  setData({
                    ...data,
                    bank: { ...data.bank, ifsc: e.target.value.toUpperCase() },
                  })
                }
                placeholder="IFSC Code"
                maxLength={11}
              />
              <Button
                onClick={submitBank}
                disabled={loading}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">PAN Verification</h3>
              </div>

              <div>
                <Label>PAN Number *</Label>
                <Input
                  type="text"
                  value={data.panNumber || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      panNumber: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-character PAN (letters + digits)
                </p>
              </div>

              <div>
                <Label>Name on PAN *</Label>
                <Input
                  type="text"
                  value={data.panName || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      panName: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="FULL NAME AS PER PAN"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your full name exactly as it appears on the PAN card
                </p>
              </div>

              <Button
                onClick={submitPan}
                disabled={
                  loading ||
                  !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.panNumber) ||
                  !data.panName
                }
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Verifying PAN..." : "Verify PAN"}
              </Button>
            </div>
          )}

          {step === 5.5 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">Aadhaar Verification</h3>
              </div>

              <div>
                <Label>Aadhaar Number *</Label>
                <Input
                  type="text"
                  value={data.aadhaarNumber || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      aadhaarNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="1234 5678 9012"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 12-digit Aadhaar number (digits only)
                </p>
              </div>

              <Button
                onClick={submitAadhaar}
                disabled={loading || data.aadhaarNumber?.length !== 12}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Verifying Aadhaar..." : "Verify Aadhaar"}
              </Button>
            </div>
          )}

          {step === 5.6 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">Enter Aadhaar OTP</h3>
              </div>

              <div>
                <Label>OTP *</Label>
                <Input
                  type="text"
                  value={data.aadhaarOTP || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      aadhaarOTP: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit OTP sent to your registered mobile number.
                </p>
              </div>

              <Button
                onClick={verifyAadhaarOTP}
                disabled={loading || data.aadhaarOTP?.length !== 6}
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <Camera className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">
                  Shop Photos & Mobile Numbers
                </h3>
              </div>

              {/* Additional Mobile Numbers */}
              <div className="space-y-3">
                <Label>Additional Mobile Numbers (Optional)</Label>
                <p className="text-xs text-gray-500">
                  Add up to 2 more numbers for Manager/Staff
                </p>

                {data.alternatePhones.map((phone, index) => (
                  <div
                    key={index}
                    className="space-y-2 border p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="+91XXXXXXXXXX"
                        value={phone.number}
                        onChange={(e) => {
                          const updated = [...data.alternatePhones];
                          updated[index].number = e.target.value;
                          setData({ ...data, alternatePhones: updated });
                        }}
                        className="flex-1"
                        disabled={phone.verified}
                      />
                      <select
                        value={phone.label}
                        onChange={(e) => {
                          const updated = [...data.alternatePhones];
                          updated[index].label = e.target.value;
                          setData({ ...data, alternatePhones: updated });
                        }}
                        className="border rounded px-3 py-1"
                      >
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
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
                            return setError("Enter mobile number first");
                          setLoading(true);
                          const res = await sendAlternateOTP(
                            phone.number,
                            phone.label
                          );
                          setLoading(false);
                          if (res.success) {
                            const updated = [...data.alternatePhones];
                            updated[index].otpSent = true;
                            setData({ ...data, alternatePhones: updated });
                            setSuccess(`✅ OTP sent to ${phone.number}`);
                          } else {
                            setError(res.message || "Failed to send OTP");
                          }
                        }}
                        className="bg-[#F4B321] text-gray-900 w-full"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </Button>
                    )}

                    {phone.otpSent && !phone.verified && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter OTP"
                          maxLength={6}
                          value={phone.otp || ""}
                          onChange={(e) => {
                            const updated = [...data.alternatePhones];
                            updated[index].otp = e.target.value;
                            setData({ ...data, alternatePhones: updated });
                          }}
                          className="text-center text-lg"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#F4B321] text-gray-900"
                            onClick={async () => {
                              if (!phone.otp)
                                return setError("Enter OTP to verify number");
                              setLoading(true);
                              const res = await verifyAlternateOTP(
                                phone.number,
                                phone.otp
                              );
                              setLoading(false);
                              if (res.success) {
                                const updated = [...data.alternatePhones];
                                updated[index].verified = true;
                                setData({ ...data, alternatePhones: updated });
                                setSuccess(
                                  `✅ ${phone.number} verified successfully`
                                );
                              } else {
                                setError(res.message || "Invalid OTP");
                              }
                            }}
                            disabled={loading}
                          >
                            {loading ? "Verifying..." : "Verify OTP"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await sendAlternateOTP(phone.number);
                              if (res.success) {
                                setSuccess(`OTP resent to ${phone.number}`);
                              } else {
                                setError(res.message || "Failed to resend OTP");
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

                {data.alternatePhones.length < 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhone}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Another Number
                  </Button>
                )}
              </div>

              {/* Shop Photos */}
              <div className="space-y-3">
                <Label>Shop Photos * (Minimum 2: Outside + Inside)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Outside View</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "outside")}
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Inside View</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "inside")}
                      disabled={uploading}
                    />
                  </div>
                </div>
                {uploading && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}
                {data.shopPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {data.shopPhotos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img
                          src={photo.url}
                          alt={photo.type}
                          className="w-full h-24 object-cover rounded border-2 border-green-500"
                        />
                        <Badge className="absolute top-1 right-1 bg-green-600 text-white text-xs">
                          {photo.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={submitPhotos}
                disabled={
                  loading ||
                  data.shopPhotos.length < 2 ||
                  data.alternatePhones.some((p) => p.number && !p.verified)
                }
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          )}

          {step === 7 && (
            <div className="text-center py-8">
              <Store className="w-20 h-20 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Under Review</h2>
              <p className="text-gray-600 mb-4">
                Your application is being reviewed by our admin team. You'll
                receive an email once approved!
              </p>
              <Badge className="bg-amber-500 text-white text-lg px-6 py-2">
                Pending Admin Approval
              </Badge>
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>✅ Mobile Verified</p>
                <p>✅ Email Verified</p>
                <p>✅ GST Verified: {data.businessName}</p>
                <p>✅ Bank Verified</p>
                <p>✅ KYC Documents Uploaded</p>
                <p>✅ Shop Photos Uploaded</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
