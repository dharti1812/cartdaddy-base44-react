import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getSarvConfig } from "../components/utils/sarvAPI";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function TestSARV() {
  const config = getSarvConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">🧪 SARV Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-yellow-50 border-yellow-500 border-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-bold text-yellow-900 text-lg">⚠️ TESTING MODE ACTIVE</p>
                <p className="text-yellow-800">
                  OTP verification is currently in <strong>bypass mode</strong> for testing.
                </p>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-3">
                  <p className="font-bold text-yellow-900 mb-2">🔑 Use this OTP for all verifications:</p>
                  <div className="flex items-center gap-3">
                    <code className="bg-white px-6 py-3 rounded text-3xl font-bold text-yellow-900 border-2 border-yellow-400">
                      123456
                    </code>
                    <Badge className="bg-yellow-600 text-white text-sm">
                      Universal Bypass Code
                    </Badge>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="font-bold text-blue-900 mb-3">📋 Configuration Details:</p>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>User ID:</strong> {config.userId}</p>
              <p><strong>Sender ID 1:</strong> {config.senderId1}</p>
              <p><strong>Sender ID 2:</strong> {config.senderId2}</p>
              <p><strong>Template 1:</strong> {config.templates.mobileVerificationOTP}</p>
              <p><strong>Template 2:</strong> {config.templates.orderOTP}</p>
              <p><strong>Test Mode:</strong> <Badge className="bg-yellow-600">Enabled</Badge></p>
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              <p className="text-green-900">
                <strong>✅ System Ready for Testing</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-green-800 list-disc list-inside">
                <li>Retailer Onboarding: Use OTP <strong>123456</strong></li>
                <li>Delivery Boy Registration: Use OTP <strong>123456</strong></li>
                <li>Email Verification: Use OTP <strong>123456</strong></li>
                <li>All other OTP verifications: Use <strong>123456</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Once SARV SMS integration is working, we'll disable test mode and use real OTPs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}