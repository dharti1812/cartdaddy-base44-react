import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, User, Banknote, Loader2 } from "lucide-react";

import { AuthApi } from "@/components/utils/authApi";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";

export default function DeliveryBoyProfileSettings({
  dBProfile,
  onUpdateProfile,
}) {
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [editGeneral, setEditGeneral] = useState(false);

  const [generalForm, setGeneralForm] = useState({
    name: dBProfile?.name || "",
    phone: dBProfile?.phone || "",
    email: dBProfile?.email || "",
  });

  /* ---------------- BANK STATE ---------------- */
  const [showBankForm, setShowBankForm] = useState(false);

  const [bankData, setBankData] = useState({
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    nameAtBank: "",
  });

  useEffect(() => {
    if (dBProfile) {
      setGeneralForm({
        name: dBProfile.name || "",
        phone: dBProfile.phone || "",
        email: dBProfile.email || "",
      });
    }
    if (dBProfile?.bank_information) {
      setBankData({
        account_number: dBProfile.bank_information.account_number || "",
        ifsc_code: dBProfile.bank_information.ifsc || "",
        bank_name: dBProfile.bank_information.bank_name || "",
        nameAtBank: dBProfile.bank_information.nameAtBank || "",
      });
    }
  }, [dBProfile]);

  const handleBankDataChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    try {
      await deliveryPartnerApi.updateProfile(generalForm);
      alert("Profile updated successfully");
      setEditGeneral(false);
      onUpdateProfile();
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const [bankLoading, setBankLoading] = useState(false);

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setBankLoading(true);
    try {
      const payload = {
        acno: bankData.account_number,
        ifsc: bankData.ifsc_code,
        bank_name: bankData.bank_name || "",
      };
      const response = await deliveryPartnerApi.changeBank(payload);

      if (response.verified) {
        alert(response.message);
        setBankData({
          account_number: response.bank_info.account_number,
          ifsc_code: response.bank_info.ifsc,
          bank_name: bankData.bank_name,
          account_holder_name: response.bank_info.account_holder_name,
        });
        setShowBankForm(false);
        onUpdateProfile();
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update bank details");
    } finally {
      setBankLoading(false);
    }
  };

  /* ---------------- PASSWORD STATE ---------------- */
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await AuthApi.changePassword(passwordForm);
      if (response?.message) {
        setPasswordSuccess(true);
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      }
    } catch (error) {
      setPasswordError(error.message || "Password update failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="p-0 mb-4">
        <CardDescription>
          Manage your personal details, security, and banking information.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 mb-4">
            <TabsTrigger value="general">
              <User className="w-4 h-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" /> Security
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Banknote className="w-4 h-4 mr-2" /> Bank
            </TabsTrigger>
          </TabsList>

          {/* ---------------- GENERAL ---------------- */}
          <TabsContent value="general">
            {!editGeneral ? (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Name</Label>
                    <p>{dBProfile?.name}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p>{dBProfile?.phone}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{dBProfile?.email}</p>
                  </div>
                </div>

                <Button onClick={() => setEditGeneral(true)}>Edit</Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateGeneral} className="space-y-3">
                <Input
                  name="name"
                  value={generalForm.name}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, name: e.target.value })
                  }
                />
                <Input
                  name="phone"
                  value={generalForm.phone}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, phone: e.target.value })
                  }
                />
                <Input
                  name="email"
                  value={generalForm.email}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, email: e.target.value })
                  }
                />

                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditGeneral(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* ---------------- SECURITY ---------------- */}
          <TabsContent value="security">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="bg-green-100 p-3 rounded text-sm">
                  Password updated successfully
                </div>
              )}
              {passwordError && (
                <div className="bg-red-100 p-3 rounded text-sm">
                  {passwordError}
                </div>
              )}

              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  name="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  name="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  name="new_password_confirmation"
                  type="password"
                  value={passwordForm.new_password_confirmation}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#075E66]"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Lock className="mr-2 w-4 h-4" />
                )}
                Change Password
              </Button>
            </form>
          </TabsContent>

          {/* ---------------- BANK ---------------- */}
          <TabsContent value="bank" className="space-y-4">
            {/* READ ONLY */}
            {!showBankForm && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-semibold text-gray-700">
                  Current Bank Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Account Number</Label>
                    <p className="font-medium">
                      {bankData.account_number || "Not added"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-500">IFSC Code</Label>
                    <p className="font-medium">
                      {bankData.ifsc_code || "Not added"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-500">Account Holder Name</Label>
                    <p className="font-medium">
                      {bankData.nameAtBank || "Not added"}
                    </p>
                  </div>
                </div>

                <Button
                  className="bg-[#075E66]"
                  onClick={() => setShowBankForm(true)}
                >
                  Change Bank Details
                </Button>
              </div>
            )}

            {/* EDIT FORM */}
            {showBankForm && (
              <form onSubmit={handleUpdateBankDetails} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please ensure your bank details are accurate for payouts.
                </p>

                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    name="account_number"
                    value={bankData.account_number}
                    onChange={handleBankDataChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    name="ifsc_code"
                    value={bankData.ifsc_code}
                    onChange={handleBankDataChange}
                    maxLength={11}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    name="bank_name"
                    value={bankData.bank_name}
                    onChange={handleBankDataChange}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-[#075E66]"
                    disabled={bankLoading}
                  >
                    {bankLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBankForm(false);
                      setBankData({
                        account_number:
                          dBProfile?.bank_information?.account_number || "",
                        ifsc_code: dBProfile?.bank_information?.ifsc || "",
                        bank_name: dBProfile?.bank_information?.bank_name || "",
                        nameAtBank:
                          dBProfile?.bank_information?.nameAtBank || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
