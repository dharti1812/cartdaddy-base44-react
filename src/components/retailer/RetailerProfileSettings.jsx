// File: ../components/retailer/RetailerProfileSettings.jsx

import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, User, Banknote, Loader2 } from "lucide-react"; // Added Loader2
// 💡 Assuming AuthApi handles your authenticated fetch requests
import { AuthApi } from "@/components/utils/authApi";
import { retailerApi } from "@/components/utils/retailerApi";

export default function RetailerProfileSettings({ retailerProfile, onUpdateProfile, onLogout }) {
    const [activeSettingsTab, setActiveSettingsTab] = useState("general");

    // General Profile State (Pre-filled)
    const [profileData, setProfileData] = useState({
        name: retailerProfile?.name || "",
        business_name: retailerProfile?.business_name || "",
    });

    const [bankData, setBankData] = useState({
        account_number: retailerProfile?.bank_details?.account_number || '',
        ifsc_code: retailerProfile?.bank_details?.ifsc_code || '',
        bank_name: retailerProfile?.bank_details?.bank_name || '',
    });

    // Security State
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // ⬇️ NEW HANDLER
    const handleBankDataChange = (e) => {
        const { name, value } = e.target;
        setBankData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateBankDetails = async (e) => {
        e.preventDefault();

        // Assuming you have setBankLoading(true) here
        // setBankLoading(true);
        // setBankError(null);

        try {
            console.log("Saving bank details:", bankData);
            // 💡 Use the corrected utility function
            const response = await retailerApi.changeBank(bankData);

            if (response && response.message) {
                // setBankSuccess(true);
                alert(response.message);
                onUpdateProfile(); // Refresh main data and close modal
            }

        } catch (error) {
            console.error("Bank details update failed:", error);

            // Example handling for validation errors (422)
            if (error.response && error.response.data && error.response.data.errors) {
                // setBankError(handleValidationErrors(error.response.data.errors));
            } else {
                // setBankError(error.message || "Failed to update bank details.");
            }

        } finally {
            // setBankLoading(false);
        }
    };


    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };


    const handleUpdateProfile = (e) => {
        e.preventDefault();
        // ⚠️ TODO: Implement actual API call to update name, business_name, etc.
        console.log("Updating profile with:", profileData);
        alert("Profile update (Simulated)!");
        onUpdateProfile(); // Close modal and refresh data
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        setPasswordLoading(true);

        try {
            // 💡 CORRECTED CALL: Pass passwordForm data to the AuthApi function
            const response = await AuthApi.changePassword(passwordForm);

            if (response && response.message) {
                setPasswordSuccess(true);
                // Clear the form fields
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: ''
                });


            }
        } catch (error) {
            console.error("Password change failed:", error);

            // Handle error structure thrown by the corrected AuthApi.changePassword
            // This handles both 422 validation errors and other API errors.
            if (error.response && error.response.data && error.response.data.errors) {
                const validationErrors = error.response.data.errors;
                // Get the message for the first field that failed validation
                let errorMessage = validationErrors[Object.keys(validationErrors)[0]][0];

                setPasswordError(errorMessage);

            } else {
                // Generic network error or error thrown when token is missing
                setPasswordError(error.message || "An unexpected error occurred during password change.");
            }
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
                <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto bg-gray-100 border-b mb-4">
                        <TabsTrigger value="general"><User className="w-4 h-4 mr-2" />General</TabsTrigger>
                        <TabsTrigger value="security"><Lock className="w-4 h-4 mr-2" />Security</TabsTrigger>
                        <TabsTrigger value="bank"><Banknote className="w-4 h-4 mr-2" />Bank Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Retailer Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={profileData.name}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="business_name">Business Name</Label>
                                <Input
                                    id="business_name"
                                    name="business_name"
                                    value={profileData.business_name}
                                    disabled
                                />
                            </div>

                        </form>
                    </TabsContent>

                    <TabsContent value="security">
                        <form onSubmit={handleUpdatePassword} className="space-y-4">

                            {passwordSuccess && (
                                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                                    Password updated successfully.
                                </div>
                            )}

                            {passwordError && (
                                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                    Error: {passwordError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    name="current_password"
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new_password">New Password (Min 8 characters)</Label>
                                <Input
                                    id="new_password"
                                    name="new_password"
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="new_password_confirmation"
                                    name="new_password_confirmation"
                                    type="password"
                                    value={passwordForm.new_password_confirmation}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={passwordLoading}
                                className="bg-[#075E66] hover:bg-[#064d54] w-full"
                            >
                                {passwordLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Lock className="w-4 h-4 mr-2" />
                                )}
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="bank">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Your banking information is crucial for payout processing. Please ensure these details are accurate.
                            </p>

                            {/* ⚠️ NOTE: You must add the corresponding state management and API handler (e.g., handleUpdateBankDetails)
           to the RetailerProfileSettings component logic (similar to how password change was implemented). */}

                            <form onSubmit={handleUpdateBankDetails} className="space-y-4">


                                {/* 2. Account Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="account_number">Bank Account Number</Label>
                                    <Input
                                        id="account_number"
                                        name="account_number"
                                        type="text"
                                        // value={bankData.account_number}
                                        onChange={handleBankDataChange}
                                        placeholder="Enter full account number"
                                        required
                                    />
                                </div>

                                {/* 3. IFSC Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="ifsc_code">IFSC Code (11 characters)</Label>
                                    <Input
                                        id="ifsc_code"
                                        name="ifsc_code"
                                        type="text"
                                        // value={bankData.ifsc_code}
                                        onChange={handleBankDataChange}
                                        placeholder="E.g., SBIN0001234"
                                        maxLength={11}
                                        required
                                    />
                                </div>

                                {/* 4. Bank Name (Optional/Display) */}
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                                    <Input
                                        id="bank_name"
                                        name="bank_name"
                                        type="text"
                                        // value={bankData.bank_name}
                                        onChange={handleBankDataChange}
                                        placeholder="E.g., State Bank of India"
                                    />
                                </div>

                                <Button type="submit" className="bg-[#075E66] hover:bg-[#064d54]">
                                    <Banknote className="w-4 h-4 mr-2" />
                                    Save Bank Details
                                </Button>
                            </form>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}