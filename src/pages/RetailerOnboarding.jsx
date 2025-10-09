
import React, { useState, useEffect } from "react";
import { Retailer, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Building2, CheckCircle, Loader2, AlertCircle, Store, LogOut, Camera, Plus, Trash2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";
import { verifyBankAccount, verifyGSTIN } from "@/components/utils/cashfreeConfig";
import { UploadFile } from "@/api/integrations";
import { API_BASE_URL } from '../../src/config';

const sendOTP = async (phone, name) => {
  console.log(`Sending OTP to ${name} at ${phone}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    documents: []
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
      const allRetailers = await Retailer.list();
      const myRetailers = allRetailers.filter(r => r.user_id === user.id);

      let currentRetailer = null;

      if (myRetailers.length > 1) {
        const sorted = myRetailers.sort((a, b) => {
          if (a.onboarding_status === 'approved' && b.onboarding_status !== 'approved') return -1;
          if (b.onboarding_status === 'approved' && a.onboarding_status !== 'approved') return 1;
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
        setData({ ...data, ...currentRetailer });
        let nextStep = 1;
        if (currentRetailer.onboarding_status === "email_pending") nextStep = 2;
        else if (currentRetailer.onboarding_status === "gst_pending") nextStep = 3;
        else if (currentRetailer.onboarding_status === "bank_pending") nextStep = 4;
        else if (currentRetailer.onboarding_status === "docs_pending") nextStep = 5;
        else if (currentRetailer.onboarding_status === "photos_pending") nextStep = 6;
        else if (currentRetailer.onboarding_status === "admin_approval_pending") nextStep = 7;
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
    if (!data.name || !data.phone) return setError("Enter name and phone");

    const allSellers = await Retailer.list();
    const cleanPhone = data.phone.replace(/\D/g, '');

    const existingSeller = allSellers.find(s => {
      const sClean = s.phone?.replace(/\D/g, '') || '';
      return sClean === cleanPhone || sClean.endsWith(cleanPhone) || cleanPhone.endsWith(sClean);
    });

    const user = await User.me();

    if (existingSeller && existingSeller.user_id !== user.id) {
      return setError("This phone number is already registered with another account.");
    }

    setLoading(true);
    const otpResponse = await sendOTP(data.phone, data.name); 
    if (otpResponse.success) {
      setSuccess("✅ OTP sent to your phone");
      setStep(1.5);
    } else {
      setError(otpResponse.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const verifyPhone = async () => {
    if (!otp || !data.phone) return setError("Enter OTP and phone number");
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
        full_name: data.name
      });
    } else {
      r = await Retailer.create({ 
        user_id: user.id, 
        full_name: data.name, 
        phone: data.phone, 
        phone_verified: true, 
        onboarding_status: "email_pending" 
      });
    }

    setRetailer(r);
    setSuccess("✅ Phone verified");
    setOtp("");
    setStep(2); 
    setLoading(false);
  };

  const submitEmail = async () => {
  if (!data.email) return setError("Enter email");
  if (!data.phone) return setError("Phone number not verified");

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
  if (!otp || !data.phone) return setError("Enter OTP and phone number");
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
      onboarding_status: "gst_pending" 
    });

    setSuccess("✅ Email verified");
    setOtp("");
    setStep(3);
  } catch (err) {
    setError(err.message);
  }

  setLoading(false);
};

  const submitGST = async () => {
  if (!data.gst || data.gst.length !== 15) return setError("Enter valid 15-digit GST number");
  if (!data.phone) return setError("Phone not verified");

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/verifygstinweb`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gstin: data.gst })
    });

    const result = await response.json();

    if (result.verified) {
      setData({
        ...data,
        businessName: result.trade_name_of_business,
        gstInfo: result
      });

      setSuccess("✅ GST verified - Business: " + result.trade_name_of_business);

      // Update retailer frontend state
      setRetailer(prev => ({
        ...prev,
        gst_number: data.gst,
        business_name: result.trade_name_of_business,
        gst_verified: true,
        gst_verification_data: result,
        onboarding_status: "bank_pending"
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
    try {
      const result = await verifyBankAccount(data.bank.acc, data.bank.ifsc);
      if (result.success) {
        await Retailer.update(retailer.id, { 
          bank_account: data.bank, 
          bank_verified: true, 
          onboarding_status: "docs_pending" 
        });
        setSuccess("✅ Bank verified");
        setStep(5);
      } else {
        setError("Invalid bank details");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleAddPhone = () => {
    if (data.alternatePhones.length >= 2) return;
    setData({
      ...data,
      alternatePhones: [...data.alternatePhones, { number: "", label: "staff" }]
    });
  };

  const handleRemovePhone = (index) => {
    setData({
      ...data,
      alternatePhones: data.alternatePhones.filter((_, i) => i !== index)
    });
  };

  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setData(prev => ({
        ...prev,
        documents: [...prev.documents, { url: file_url, type: type, uploaded_at: new Date().toISOString() }]
      }));
    } catch (err) {
      setError("Failed to upload document");
    }
    setUploading(false);
  };

  const submitDocs = async () => {
    if (!data.documents.some(d => d.type === 'pan') || !data.documents.some(d => d.type === 'aadhaar')) {
      return setError("Please upload both PAN and Aadhaar documents");
    }
    setLoading(true);
    await Retailer.update(retailer.id, { 
      documents: data.documents, 
      onboarding_status: "photos_pending" 
    });
    setSuccess("✅ Documents uploaded");
    setStep(6);
    setLoading(false);
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      // Get current location
      const location = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: new Date().toISOString()
          }),
          () => resolve(null)
        );
      });

      setData({
        ...data,
        shopPhotos: [...data.shopPhotos, { 
          url: file_url, 
          type: type,
          location: location,
          manually_verified: false
        }]
      });
    } catch (err) {
      setError("Failed to upload photo");
    }
    setUploading(false);
  };

  const submitPhotos = async () => {
    if (data.shopPhotos.length < 2) {
      return setError("Please upload at least 2 shop photos (outside + inside)");
    }

    setLoading(true);
    try {
      // Save alternate phones and photos
      await Retailer.update(retailer.id, {
        alternate_phones: data.alternatePhones.filter(p => p.number),
        shop_photos: data.shopPhotos,
        onboarding_status: "admin_approval_pending",
        onboarding_completed_at: new Date().toISOString()
      });
      
      setSuccess("✅ Application submitted for approval!");
      setStep(7);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-white border-b-4 border-[#F4B321]">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png" className="h-12" />
              <div>
                <CardTitle>Seller Registration</CardTitle>
                <p className="text-sm text-gray-600">Step {Math.floor(step)} of 7</p>
              </div>
            </div>
            <div className="flex gap-2">
              {retailer && (
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout from seller profile">
                  <LogOut className="w-5 h-5 text-red-600" />
                </Button>
              )}
              {!retailer && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = createPageUrl("RetailerLogin")}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
          <Progress value={(Math.floor(step) / 7) * 100} className="mt-4 h-3" />
        </CardHeader>

        <CardContent className="p-8">
          {error && <Alert className="mb-4 bg-red-50"><AlertCircle className="w-4 h-4 text-red-600" /><AlertDescription className="text-red-800">{error}</AlertDescription></Alert>}
          {success && <Alert className="mb-4 bg-green-50"><CheckCircle className="w-4 h-4 text-green-600" /><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Phone className="w-16 h-16 text-[#F4B321] mx-auto mb-4" />
                <h3 className="text-2xl font-bold">Your Details</h3>
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="Owner/Manager Name" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="+91XXXXXXXXXX" />
              </div>
              <Button onClick={submitPhone} disabled={loading} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Sending..." : "sendOTP"}
              </Button>
            </div>
          )}

          {step === 1.5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold">Verify Phone</h3>
              </div>
              <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} className="text-center text-lg" />
              <Button onClick={verifyPhone} disabled={loading || otp.length !== 6} className="w-full bg-[#F4B321] text-gray-900 font-bold">
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center"><Mail className="w-16 h-16 text-[#F4B321] mx-auto" /><h3 className="text-2xl font-bold">Email</h3></div>
              <Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="your@email.com" />
              <Button onClick={submitEmail} disabled={loading} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          )}

          {step === 2.5 && (
            <div className="space-y-6">
              <div className="text-center"><h3 className="text-2xl font-bold">Verify Email</h3></div>
              <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} className="text-center text-lg" />
              <Button onClick={verifyEmail} disabled={loading || otp.length !== 6} className="w-full bg-[#F4B321] text-gray-900 font-bold">
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center"><Building2 className="w-16 h-16 text-[#F4B321] mx-auto" /><h3 className="text-2xl font-bold">GST Details</h3></div>
              <div>
                <Label>GST Number *</Label>
                <Input 
                  value={data.gst} 
                  onChange={e => setData({ ...data, gst: e.target.value.toUpperCase() })} 
                  placeholder="22AAAAA0000A1Z5" 
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">Your business name will be auto-verified from GST records</p>
              </div>
              <Button onClick={submitGST} disabled={loading} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Verifying GST..." : "Verify GST"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center"><Building2 className="w-16 h-16 text-[#F4B321] mx-auto" /><h3 className="text-2xl font-bold">Bank Details</h3></div>
              {data.businessName && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Business Name:</strong> {data.businessName}
                  </AlertDescription>
                </Alert>
              )}
              <Input value={data.bank.acc} onChange={e => setData({ ...data, bank: { ...data.bank, acc: e.target.value } })} placeholder="Account Number" />
              <Input value={data.bank.ifsc} onChange={e => setData({ ...data, bank: { ...data.bank, ifsc: e.target.value.toUpperCase() } })} placeholder="IFSC Code" maxLength={11} />
              <Button onClick={submitBank} disabled={loading} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </div>
          )}

          {step === 5 && (
             <div className="space-y-6">
              <div className="text-center"><FileText className="w-16 h-16 text-[#F4B321] mx-auto" /><h3 className="text-2xl font-bold">KYC Documents</h3></div>
              <p className="text-sm text-center text-gray-600">Please upload clear images of your PAN and Aadhaar cards.</p>
              
              <div className="space-y-4">
                <div>
                  <Label>PAN Card *</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleDocUpload(e, 'pan')} disabled={uploading || data.documents.some(d => d.type === 'pan')} />
                  {data.documents.some(d => d.type === 'pan') && <p className="text-xs text-green-600 mt-1">PAN Card uploaded.</p>}
                </div>
                <div>
                  <Label>Aadhaar Card *</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleDocUpload(e, 'aadhaar')} disabled={uploading || data.documents.some(d => d.type === 'aadhaar')} />
                  {data.documents.some(d => d.type === 'aadhaar') && <p className="text-xs text-green-600 mt-1">Aadhaar Card uploaded.</p>}
                </div>
              </div>
              {uploading && <p className="text-sm text-blue-600 text-center">Uploading...</p>}
              
              <Button onClick={submitDocs} disabled={loading || uploading || !data.documents.some(d => d.type === 'pan') || !data.documents.some(d => d.type === 'aadhaar')} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Saving..." : "Continue to Shop Photos"}
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center"><Camera className="w-16 h-16 text-[#F4B321] mx-auto" /><h3 className="text-2xl font-bold">Shop Photos & Contact Numbers</h3></div>
              
              {/* Additional Contact Numbers */}
              <div className="space-y-3">
                <Label>Additional Contact Numbers (Optional)</Label>
                <p className="text-xs text-gray-500">Add up to 2 more numbers for Manager/Staff</p>
                {data.alternatePhones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="+91XXXXXXXXXX"
                      value={phone.number}
                      onChange={e => {
                        const updated = [...data.alternatePhones];
                        updated[index].number = e.target.value;
                        setData({ ...data, alternatePhones: updated });
                      }}
                      className="flex-1"
                    />
                    <select
                      value={phone.label}
                      onChange={e => {
                        const updated = [...data.alternatePhones];
                        updated[index].label = e.target.value;
                        setData({ ...data, alternatePhones: updated });
                      }}
                      className="border rounded px-3"
                    >
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePhone(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {data.alternatePhones.length < 2 && (
                  <Button variant="outline" size="sm" onClick={handleAddPhone} className="w-full">
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
                    <Input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'outside')} disabled={uploading} />
                  </div>
                  <div>
                    <Label className="text-xs">Inside View</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'inside')} disabled={uploading} />
                  </div>
                </div>
                {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
                {data.shopPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {data.shopPhotos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img src={photo.url} alt={photo.type} className="w-full h-24 object-cover rounded border-2 border-green-500" />
                        <Badge className="absolute top-1 right-1 bg-green-600 text-white text-xs">{photo.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={submitPhotos} disabled={loading || data.shopPhotos.length < 2} className="w-full bg-[#F4B321] text-gray-900 font-bold py-6">
                {loading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          )}

          {step === 7 && (
            <div className="text-center py-8">
              <Store className="w-20 h-20 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Under Review</h2>
              <p className="text-gray-600 mb-4">Your application is being reviewed by our admin team. You'll receive an email once approved!</p>
              <Badge className="bg-amber-500 text-white text-lg px-6 py-2">Pending Admin Approval</Badge>
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>✅ Phone Verified</p>
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
