import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, Send, Plus } from "lucide-react";
import { sendAlternatePhoneOTP, verifyAlternatePhoneOTP } from "@/pages/RetailerOnboarding"; // replace with your API functions


export function AdditionalPhones({ data, setData }) {
  const [otpModal, setOtpModal] = useState({ open: false, phoneId: null, otp: "" });

  // Add a new alternate phone
  const handleAddPhone = () => {
    if (data.alternatePhones.length >= 2) return;
    setData({
      ...data,
      alternatePhones: [
        ...data.alternatePhones,
        { id: Date.now(), number: "", label: "staff", verified: false, otp: "" },
      ],
    });
  };

  // Remove a phone
  const handleRemovePhone = (id) => {
    setData({
      ...data,
      alternatePhones: data.alternatePhones.filter((p) => p.id !== id),
    });
  };

  // Open OTP modal for a phone
  const openOtpModal = (phoneId) => {
    setOtpModal({ open: true, phoneId, otp: "" });
  };

  // Send OTP for a phone
  const handleSendOTP = async (phone) => {
    const res = await sendAlternatePhoneOTP(phone.number);
    alert(res.message);
    if (res.success) openOtpModal(phone.id);
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const phone = data.alternatePhones.find((p) => p.id === otpModal.phoneId);
    const res = await verifyAlternatePhoneOTP(phone.number, otpModal.otp);
    alert(res.message);
    if (res.success) {
      const updated = data.alternatePhones.map((p) =>
        p.id === otpModal.phoneId ? { ...p, verified: true } : p
      );
      setData({ ...data, alternatePhones: updated });
      setOtpModal({ open: false, phoneId: null, otp: "" });
    }
  };

  return (
    <div className="space-y-3">
      <Label>Additional Mobile Numbers (Optional)</Label>
      <p className="text-xs text-gray-500">Add up to 2 numbers for Manager/Staff</p>

      {data.alternatePhones.map((phone) => (
        <div key={phone.id} className="flex gap-2 items-center">
          <Input
            placeholder="+91XXXXXXXXXX"
            value={phone.number}
            onChange={(e) => {
              const updated = data.alternatePhones.map((p) =>
                p.id === phone.id ? { ...p, number: e.target.value } : p
              );
              setData({ ...data, alternatePhones: updated });
            }}
            className="flex-1"
          />

          <select
            value={phone.label}
            onChange={(e) => {
              const updated = data.alternatePhones.map((p) =>
                p.id === phone.id ? { ...p, label: e.target.value } : p
              );
              setData({ ...data, alternatePhones: updated });
            }}
            className="border rounded px-3"
          >
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          {!phone.verified && (
            <Button size="sm" variant="outline" onClick={() => handleSendOTP(phone)}>
              <Send className="w-4 h-4" />
            </Button>
          )}

          {phone.verified ? <Check className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4" />}


          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemovePhone(phone.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ))}

      {data.alternatePhones.length < 2 && (
        <Button variant="outline" size="sm" onClick={handleAddPhone} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Another Number
        </Button>
      )}

      {/* OTP Modal */}
      {otpModal.open && (
        <Modal
          open={otpModal.open}
          onOpenChange={() => setOtpModal({ open: false, phoneId: null, otp: "" })}
        >
          <div className="p-4 space-y-3">
            <h3 className="text-lg font-bold">Enter OTP</h3>
            <Input
              placeholder="6-digit OTP"
              value={otpModal.otp}
              maxLength={6}
              onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value })}
            />
            <Button className="w-full" onClick={handleVerifyOTP}>
              Verify OTP
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default AdditionalPhones;