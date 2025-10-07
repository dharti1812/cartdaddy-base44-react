import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { testCashfreeConnection, getCashfreeConfig } from "../components/utils/cashfreeConfig";
import { getSarvConfig } from "../components/utils/sarvAPI";

export default function CashfreeSetup() {
  const [cashfreeStatus, setCashfreeStatus] = useState(null);
  const [sarvStatus, setSarvStatus] = useState(null);

  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    const cashfreeConfig = getCashfreeConfig();
    const sarvConfig = getSarvConfig();
    
    setCashfreeStatus({
      configured: cashfreeConfig.isConfigured,
      env: cashfreeConfig.env,
      clientId: cashfreeConfig.clientId
    });

    setSarvStatus({
      configured: sarvConfig.isConfigured,
      userId: sarvConfig.userId
    });

    await testCashfreeConnection();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Integrations Status</h1>
          <p className="text-white text-opacity-80">Live production credentials configured</p>
        </div>

        <div className="space-y-6">
          {/* Cashfree Status */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Cashfree Verification APIs
                </CardTitle>
                {cashfreeStatus?.configured ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    LIVE - PRODUCTION
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {cashfreeStatus?.configured ? (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-500">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong className="block mb-2">✅ Live Production Environment Active</strong>
                      <ul className="space-y-1 text-sm">
                        <li>• Environment: <strong>{cashfreeStatus.env.toUpperCase()}</strong></li>
                        <li>• Client ID: <strong>{cashfreeStatus.clientId.substring(0, 15)}...</strong></li>
                        <li>• All verification APIs are active</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">GSTIN Verification</h3>
                      <p className="text-sm text-blue-800">₹3 per verification</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">Bank Account Verification</h3>
                      <p className="text-sm text-purple-800">₹3 per verification</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-lg">
                      <h3 className="font-semibold text-pink-900 mb-2">Face Match Verification</h3>
                      <p className="text-sm text-pink-800">₹5 per verification</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                      <h3 className="font-semibold text-amber-900 mb-2">Aadhaar OCR</h3>
                      <p className="text-sm text-amber-800">₹3 per verification</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    Cashfree credentials not configured
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* SARV Status */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">
                  SARV Cloud Telephony
                </CardTitle>
                {sarvStatus?.configured ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    LIVE - PRODUCTION
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {sarvStatus?.configured ? (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-500">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong className="block mb-2">✅ Live Production Environment Active</strong>
                      <ul className="space-y-1 text-sm">
                        <li>• User ID: <strong>{sarvStatus.userId}</strong></li>
                        <li>• All communication channels active</li>
                        <li>• SMS, WhatsApp, Voice Call & Click-to-Call enabled</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">SMS OTP</h3>
                      <p className="text-sm text-green-800">₹0.15 per SMS</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">WhatsApp OTP</h3>
                      <p className="text-sm text-blue-800">₹0.20 per message</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">Voice Call OTP</h3>
                      <p className="text-sm text-purple-800">₹0.30 per minute</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                      <h3 className="font-semibold text-orange-900 mb-2">Click-to-Call Masking</h3>
                      <p className="text-sm text-orange-800">₹0.50 per call</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    SARV credentials not configured
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card className="border-none shadow-lg bg-gradient-to-r from-[#F4B321] to-[#e0a020]">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">📚 API Documentation</h3>
              <div className="grid gap-3">
                <a 
                  href="https://docs.cashfree.com/reference/verification-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">Cashfree Verification APIs</span>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
                <a 
                  href="https://www.sarv.com/sms-api.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">SARV Cloud Telephony APIs</span>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}