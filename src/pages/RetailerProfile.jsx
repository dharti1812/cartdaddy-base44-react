// File: ../components/retailer/RetailerProfileSettings.jsx

import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, User, Banknote } from "lucide-react";

// NOTE: You would implement the actual API calls (e.g., AuthApi.updatePassword, RetailerApi.updateProfile) here.
// The following is a structural placeholder.

export default function RetailerProfileSettings({ retailerProfile, onUpdateProfile }) {
    const [activeSettingsTab, setActiveSettingsTab] = useState("general");
    const [profileData, setProfileData] = useState({
        name: retailerProfile?.name || "",
        business_name: retailerProfile?.business_name || "",
    });

    // State for password change form (not implemented)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        // ⚠️ TODO: Implement API call to update name, business_name, etc.
        console.log("Updating profile with:", profileData);
        // On success:
        // onUpdateProfile(); 
        alert("Profile update (Simulated)!");
    };

    const handleUpdatePassword = (e) => {
        e.preventDefault();
        // ⚠️ TODO: Implement API call to update password.
        console.log("Updating password with:", passwordForm);
        alert("Password change (Simulated)!");
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="w-6 h-6 text-[#075E66]" />
                    Account Settings
                </CardTitle>
                <CardDescription>
                    Manage your personal details, security, and banking information.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="business_name">Business Name</Label>
                                <Input
                                    id="business_name"
                                    name="business_name"
                                    value={profileData.business_name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <Button type="submit" className="bg-[#075E66] hover:bg-[#064d54]">Save Changes</Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="security">
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" required />
                            </div>
                            <Button type="submit" className="bg-[#075E66] hover:bg-[#064d54]">Change Password</Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="bank">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Your banking information is crucial for payout processing.
                                (Details currently not implemented)
                            </p>
                            {/* ⚠️ TODO: Add form fields for account number, IFSC code, etc. */}
                            <Button disabled className="bg-gray-400">Save Bank Details</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}