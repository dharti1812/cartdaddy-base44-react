import { useState, useEffect } from "react";
import { Retailer, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";
import { API_BASE_URL, ASSET_BASE_URL } from "../../src/config";
import { UserApi } from "@/components/utils/userApi";

const sendOTP = async (phone, name) => {
  console.log(`Sending OTP to ${name} at ${phone}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, user_type: "seller" }),
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const verifyOTP = async (phone_otp, phone, user_type = "seller") => {
  console.log(`verifying OTP ${phone_otp} for ${phone}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        phone_otp,
        user_type,
      }),
    });

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: error.message };
  }
};

const sendAlternateOTP = async (phone, role, name) => {
  try {
    const access_token = localStorage.getItem("access_token");
    console.log(phone, role, name);
    const res = await fetch(`${API_BASE_URL}/api/send-otp/additional-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ phone, role, name }),
    });
    const result = await res.json();
    console.log(result, "hdar");
    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
};

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

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

// Function to calculate distance between two coordinates (in meters) using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function SellerOnboarding() {
  const [step, setStep] = useState(1);

  const goBack = () => {
    switch (step) {
      case 1.5:
        setStep(1);
        break;
      case 2:
        setStep(1.5);
        break;
      case 2.5:
        setStep(2);
        break;
      case 3:
        setStep(2.5);
        break;
      case 4:
        setStep(3);
        break;
      case 5:
        setStep(4);
        break;
      case 5.5:
        setStep(5);
        break;
      case 5.6:
        setStep(5.5);
        break;
      case 6:
        setStep(5.6);
        break;
      case 7:
        setStep(6);
        break;
      default:
        break;
    }
  };

  const handleDeletePhoto = async (photo, index) => {
    setError("");
    setSuccess("");

    // Check if we have the necessary ID before proceeding
    if (!photo.upload_id) {
      // If upload_id is missing (e.g., due to old data/missing server save), delete locally anyway but show warning
      console.warn("Missing upload ID for photo, deleting locally only.");
      setData((prev) => ({
        ...prev,
        shopPhotos: prev.shopPhotos.filter((_, i) => i !== index),
      }));
      if (index === 0) setFirstPhotoLocation(null);
      setError("Warning: Photo deleted locally, but server status is unknown.");
      return;
    }

    setLoading(true); // Start loading

    const deleteResult = await deletePhotoFromServer(photo.upload_id);

    if (deleteResult.result || deleteResult.success) {
      // Check for both result: true and success: true
      // Only delete from state if server deletion was successful
      setData((prev) => ({
        ...prev,
        shopPhotos: prev.shopPhotos.filter((_, i) => i !== index),
      }));
      if (index === 0) setFirstPhotoLocation(null);
      setSuccess("Photo deleted successfully");
    } else {
      setError(deleteResult.message || "Failed to delete photo from server.");
    }

    setLoading(false); // Stop loading
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

  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    gst: "",
    alternatePhones: [{ number: "", label: "manager", name: "" }],
    bank: { acc: "", ifsc: "" },
    shopPhotos: [],
    documents: [],
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retailer, setRetailer] = useState(null);

  // --- START: Photo Capture State and Handlers ---
  const [firstPhotoLocation, setFirstPhotoLocation] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [captureMode, setCaptureMode] = useState(null); // 'outside' or 'inside'

  const openCamera = async (type) => {
    try {
      setError("");
      setCaptureMode(type);

      // 1. Get current location first
      const location = await getCurrentLocation();

      // 2. Validate location with first photo if any photo has been captured
      if (data.shopPhotos.length > 0 && data.shopPhotos[0].location) {
        const firstLocation = data.shopPhotos[0].location;
        const distance = calculateDistance(
          firstLocation.lat,
          firstLocation.lng,
          location.lat,
          location.lng,
        );

        const MAX_DISTANCE = 50; // Max 50 meters difference
        if (distance > MAX_DISTANCE) {
          setError(
            `Photos must be taken from the same location. Distance: ${Math.round(
              distance,
            )}m. Please move within ${MAX_DISTANCE}m of the first photo location.`,
          );
          return;
        }
      }

      // 3. Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setCameraStream(stream);

      // 4. Store location for the *first* photo captured ever
      if (data.shopPhotos.length === 0) {
        // Use the location fetched *now* as the reference point
        setFirstPhotoLocation(location);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(
        err.message ||
          "Unable to access camera. Please allow camera permissions.",
      );
    }
  };

  const resolveImageUrl = (url) => {
    if (!url) return "";

    if (url.startsWith("http")) {
      try {
        const parsed = new URL(url);
        return `${ASSET_BASE_URL}${parsed.pathname}`;
      } catch {
        return url;
      }
    }

    return `${ASSET_BASE_URL}/${url.replace(/^\/+/, "")}`;
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!cameraStream) {
      setError("Camera stream not available");
      return;
    }

    try {
      setIsCapturing(true); // Set capturing state for loading spinner
      setError("");
      setSuccess("");

      const video = document.getElementById("camera-preview");

      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        throw new Error("Video not ready. Please wait a moment and try again.");
      }

      if (!video.videoWidth || !video.videoHeight) {
        throw new Error(
          "Invalid video dimensions. Please close and reopen camera.",
        );
      }

      // 1. Create Canvas and Draw Image
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2. Convert to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create image blob"));
          },
          "image/jpeg",
          0.9,
        );
      });

      // 3. Convert to base64
      const base64File = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            resolve(reader.result.split(",")[1]); // Get the base64 part
          } else {
            reject(new Error("Failed to read image"));
          }
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
      });

      // 4. Get current location (Use the stored location if available, otherwise fetch)
      let location;
      if (data.shopPhotos.length === 0 && firstPhotoLocation) {
        // Use the validated location from openCamera for the very first photo
        location = firstPhotoLocation;
      } else {
        // Fetch location again for subsequent photos
        location = await getCurrentLocation();
      }

      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not logged in");

      // 5. Prepare Payload
      const formData = {
        image: base64File,
        filename: `shop_${captureMode}_${Date.now()}.jpg`,
        type: captureMode,
        latitude: location.lat,
        longitude: location.lng,
        timestamp: location.timestamp,
      };

      // 6. Upload to Server (API call)
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
        setData((prev) => ({
          ...prev,
          shopPhotos: [
            ...prev.shopPhotos,
            {
              url: result.path,
              type: captureMode,
              location: location,
              manually_verified: false,
              upload_id: result.upload_id,
            },
          ],
        }));

        setSuccess(`✅ ${captureMode} photo captured successfully!`);
        closeCamera();
      } else {
        setError(result.message || "Failed to upload photo");
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError(err.message || "Error capturing photo");
    } finally {
      setIsCapturing(false);
    }
  };

  // Close camera
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCaptureMode(null);
  };

  const handleLogout = async () => {
    await User.logout();
    localStorage.removeItem("retailerOnboardingStep");
    window.location.reload();
  };

  const submitPhone = async () => {
    if (!data.phone) return setError("Enter mobile");

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
        "This mobile number is already registered with another account.",
      );
    }

    setLoading(true);
    const otpResponse = await sendOTP(data.phone);
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
    if (result.access_token) {
      localStorage.setItem("access_token", result.access_token);
    } else {
      console.warn("Token missing or invalid");
    }
    setError("");
    setSuccess("✅ Mobile verified");
    setOtp("");
    const nextStep = await UserApi.status(data.phone, "seller");
    setStep(nextStep.data.current_step);

    setLoading(false);
  };

  const resendPhoneOtp = async () => {
    if (!data.phone) return setError("Enter mobile number first");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/resend-otp-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone,
          user_type: "seller",
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

  const submitEmail = async () => {
    if (!data.name) return setError("Enter name");
    if (!data.email) return setError("Enter email");
    if (!data.phone) return setError("Mobile number not verified");

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          user_type: "seller",
        }),
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
        body: JSON.stringify({
          phone: data.phone,
          email_otp: otp,
          user_type: "seller",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Wrong OTP");
        setLoading(false);
        return;
      }
      setError("");
      setSuccess("✅ Email verified");
      setOtp("");
      const nextStep = await UserApi.status(data.phone, "seller");
      setStep(nextStep.data.current_step);
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
        setError("");
        setSuccess(
          "✅ GST verified - Business: " + result.trade_name_of_business,
        );

        const nextStep = await UserApi.status(result.phone, "seller");
        setStep(nextStep.data.current_step);
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

      if (!result.verified) {
        throw new Error(result.message || "Bank verification failed");
      }

      setSuccess("✅ Bank verified successfully");
      setError("");
      const nextStep = await UserApi.status(result.phone, "seller");
      setStep(nextStep.data.current_step);
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
          file,
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
    console.log("dharti");
    console.log(access_token);
    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-pan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
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
        setError("");
        setSuccess("✅ PAN verified successfully");
        const nextStep = await UserApi.status(result.phone, "seller");
        setStep(nextStep.data.current_step);
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

        setData({ ...data, refId: result.ref_id });

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
        setError("");
        setSuccess("✅ Aadhaar verified successfully");
        const nextStep = await UserApi.status(result.phone, "seller");
        setStep(nextStep.data.current_step);
      } else {
        setError(result.message || "Aadhaar verification failed");
      }
    } catch (err) {
      setError(err.message || "Server error");
    }

    setLoading(false);
  };

  const renderCaptureTile = (type, label) => {
    const isRequired = type === "outside" || type === "inside";
    const photosOfType = data.shopPhotos.filter((p) => p.type === type).length;
    const isMinMet = isRequired ? photosOfType > 0 : true;
    const isReady = !isCapturing;

    return (
      <button
        onClick={() => openCamera(type)}
        disabled={!isReady}
        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all text-center h-full min-h-[120px] ${
          !isReady
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-300 shadow-sm hover:shadow-md"
        }`}
      >
        <Camera className="w-8 h-8 mb-1" />
        <span className="font-semibold text-sm">{label}</span>
        <div className="text-xs mt-2">
          {photosOfType > 0 && (
            <Badge className="bg-green-600 text-white">
              ✓ Taken: {photosOfType}
            </Badge>
          )}
          {isRequired && photosOfType === 0 && (
            <Badge variant="destructive" className="bg-red-500 text-white">
              Required
            </Badge>
          )}
          {!isRequired && photosOfType === 0 && (
            <Badge variant="outline" className="text-gray-500">
              Optional
            </Badge>
          )}
        </div>
      </button>
    );
  };

  const submitPhotos = async () => {
    const hasOutside = data.shopPhotos.some((p) => p.type === "outside");
    const hasInside = data.shopPhotos.some((p) => p.type === "inside");

    if (!hasOutside || !hasInside) {
      return setError(
        "Please upload at least one 'Outside Shop Front' and one 'Inside Shop View' photo.",
      );
    }
    // Omitted the rest of the submitPhotos function for brevity
    // ... [Original submitPhotos logic remains here] ...

    const access_token = localStorage.getItem("access_token");
    setLoading(true);
    try {
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
        const nextStep = await UserApi.status(result.phone, "seller");
        setStep(nextStep.data.current_step);
      } else {
        setError(result.message || "Failed to submit application");
      }
    } catch (e) {
      console.error(e);
      setError("Server error while submitting application");
    }

    setLoading(false);
  };

  const deletePhotoFromServer = async (uploadId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return { success: false, message: "Not authenticated" };

    try {
      const res = await fetch(`${API_BASE_URL}/api/file/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Send the ID that identifies the file on the server
        body: JSON.stringify({ upload_id: uploadId }),
      });

      const result = await res.json();
      return result;
    } catch (e) {
      console.error("Delete network error:", e);
      return { success: false, message: "Network error during deletion" };
    }
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
                {loading ? "Sending..." : "Send OTP"}
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
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                onClick={resendPhoneOtp}
                className="w-full mt-2"
              >
                Resend OTP
              </Button>
              <BackButton />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
             
              <div className="text-center">
                <Mail className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">Email</h3>
              </div>
               <div>
                <Label>Proprietor/Partner/Director Name *</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Owner/Manager Name"
                />
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
              <BackButton />
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
              <BackButton />
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
              <BackButton />
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
              <BackButton />
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

              <BackButton />
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
              <BackButton />
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
              <BackButton />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <Camera className="w-16 h-16 text-[#F4B321] mx-auto" />
                <h3 className="text-2xl font-bold">
                  Shop Photos & Mobile Numbers
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  📍 Photos must be taken from the same location, this location
                  will be used for all pickups
                </p>
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
                        placeholder="Name"
                        value={phone.name}
                        onChange={(e) => {
                          const updated = [...data.alternatePhones];
                          updated[index].name = e.target.value;
                          setData({ ...data, alternatePhones: updated });
                        }}
                        disabled={phone.verified}
                        className="w-40"
                      />

                      <Input
                        placeholder="+91XXXXXXXXXX"
                        value={phone.number}
                        onChange={(e) => {
                          const updated = [...data.alternatePhones];
                          updated[index].number = e.target.value;
                          setData({ ...data, alternatePhones: updated });
                        }}
                        disabled={phone.verified}
                        className="flex-1"
                      />

                      <select
                        value={phone.label}
                        onChange={(e) => {
                          const updated = [...data.alternatePhones];
                          updated[index].label = e.target.value;
                          setData({ ...data, alternatePhones: updated });
                        }}
                        disabled={phone.verified}
                        className="w-28 border rounded px-3 py-1"
                      >
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>

                      {!phone.verified && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePhone(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
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
                            phone.label,
                            phone.name,
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
                                phone.otp,
                              );
                              setLoading(false);
                              if (res.success) {
                                const updated = [...data.alternatePhones];
                                updated[index].verified = true;
                                setData({ ...data, alternatePhones: updated });
                                setSuccess(
                                  `✅ ${phone.number} verified successfully`,
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
                              const res = await sendAlternateOTP(
                                phone.number,
                                phone.label,
                                phone.name,
                              );
                              console.log(res);
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

              {/* Shop Photos (Updated to use integrated logic) */}
              <div className="space-y-3">
                <Label>Shop Photos *</Label>
                <p className="text-xs text-red-600 font-semibold">
                  ⚠️ You must capture live photos using your camera. File
                  uploads are not allowed.
                </p>

                {!cameraStream ? (
                  <div className="grid grid-cols-3 gap-3">
                    {renderCaptureTile("outside", "Outside Shop Front")}
                    {renderCaptureTile("inside", "Inside Shop View")}
                    {renderCaptureTile("additional", "Additional Proof")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        id="camera-preview"
                        autoPlay
                        playsInline
                        muted
                        ref={(video) => {
                          if (video && cameraStream) {
                            video.srcObject = cameraStream;
                          }
                        }}
                        className="w-full"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded capitalize">
                        Capturing: {captureMode}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        className="flex-1 bg-green-600 text-white py-6"
                      >
                        {isCapturing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 mr-2" />
                            Capture Photo
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={closeCamera}
                        variant="outline"
                        disabled={isCapturing}
                        className="px-6"
                      >
                        <X className="w-5 h-5" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {data.shopPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {data.shopPhotos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img
                          src={resolveImageUrl(photo.url)}
                          alt={photo.type}
                          className="w-full h-32 object-cover rounded border-2 border-green-500"
                        />
                        <Badge className="absolute top-1 right-1 bg-green-600 text-white text-xs capitalize">
                          ✓ {photo.type}
                        </Badge>
                        {photo.location && (
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {photo.location.lat.toFixed(4)},{" "}
                            {photo.location.lng.toFixed(4)}
                          </div>
                        )}
                        {/* Optional: Add a button to delete the photo */}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 left-1 bg-red-500 bg-opacity-80 hover:bg-red-700 h-6 w-6"
                          onClick={() => handleDeletePhoto(photo, i)} // <-- NEW HANDLER
                          disabled={loading} // Disable delete button during any server activity
                        >
                          {loading ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-white" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={submitPhotos}
                disabled={
                  loading ||
                  !data.shopPhotos.some((p) => p.type === "outside") || // Check minimum outside
                  !data.shopPhotos.some((p) => p.type === "inside") || // Check minimum inside
                  data.alternatePhones.some((p) => p.number && !p.verified)
                }
                className="w-full bg-[#F4B321] text-gray-900 font-bold py-6"
              >
                {loading
                  ? "Submitting..."
                  : `Submit ${data.shopPhotos.length} Photos for Approval`}
              </Button>
              <BackButton />
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
              <button
                onClick={() =>
                  (window.location.href = createPageUrl("RetailerLogin"))
                }
                className="mt-8 bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-900 transition"
              >
                Close
              </button>

              <p className="mt-4 text-xs sm:text-sm font-semibold text-gray-700">
                Once approved, you will receive a confirmation email with login
                credentials to access your seller portal.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
