import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, CheckCircle, Code, Server, Lock, 
  Zap, Shield, ExternalLink 
} from "lucide-react";

export default function SARVBackendSetup() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-br from-[#075E66] to-[#064d54] text-white border-b-4 border-[#F4B321]">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Server className="w-8 h-8" />
              SARV SMS Backend Integration Setup
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Current Status */}
            <Alert className="bg-amber-50 border-amber-500 border-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Current Status: Test Mode Active</strong><br/>
                SMS API is using bypass OTP (123456) because browser blocks HTTP requests from HTTPS pages.
              </AlertDescription>
            </Alert>

            {/* Why Backend is Needed */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Why Do We Need Backend Proxy?
              </h3>
              <div className="space-y-2 text-blue-900">
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span><strong>Mixed Content Policy:</strong> SARV API uses HTTP, your app uses HTTPS</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span><strong>Browser Security:</strong> Modern browsers block HTTP requests from HTTPS pages</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span><strong>API Credentials:</strong> Backend keeps your API keys secure (not exposed in browser)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span><strong>Server-to-Server:</strong> Backend can call HTTP APIs without browser restrictions</span>
                </p>
              </div>
            </div>

            {/* Setup Steps */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Setup Steps:</h3>

              {/* Step 1 */}
              <div className={`border-2 rounded-lg p-4 ${step >= 1 ? 'border-[#F4B321] bg-[#F4B321] bg-opacity-10' : 'border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#F4B321] text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Enable Backend Functions</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Go to <strong>Dashboard → Settings → Backend Functions</strong> and enable serverless functions for this app.
                    </p>
                    <Alert className="bg-white border-gray-300">
                      <AlertDescription className="text-gray-700 text-sm">
                        ⚠️ <strong>Important:</strong> You need to enable this feature from your base44 dashboard first. Once enabled, come back here and I'll create the backend code for you.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`border-2 rounded-lg p-4 ${step >= 2 ? 'border-[#F4B321] bg-[#F4B321] bg-opacity-10' : 'border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-[#F4B321] text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Backend Proxy Will Be Created</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Once backend functions are enabled, I'll create a serverless function that:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Receives SMS requests from your frontend (HTTPS)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Calls SARV API with your credentials (HTTP allowed server-side)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Returns response to frontend
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Keeps your API credentials secure
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`border-2 rounded-lg p-4 ${step >= 3 ? 'border-[#F4B321] bg-[#F4B321] bg-opacity-10' : 'border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[#F4B321] text-white' : 'bg-gray-300 text-gray-600'}`}>
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Update Frontend to Use Backend</h4>
                    <p className="text-sm text-gray-700">
                      Frontend will call your backend proxy instead of SARV API directly. Real SMS will work! 🎉
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Architecture Flow
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">Frontend (HTTPS)</Badge>
                  <span>→</span>
                  <Badge className="bg-blue-500 text-white">Your Backend Proxy (HTTPS)</Badge>
                  <span>→</span>
                  <Badge className="bg-purple-500 text-white">SARV API (HTTP)</Badge>
                </div>
                <div className="text-xs text-gray-600 pl-4">
                  ✅ Browser happy (all HTTPS)<br/>
                  ✅ Backend can call HTTP APIs<br/>
                  ✅ Credentials secure<br/>
                  ✅ Real SMS delivered!
                </div>
              </div>
            </div>

            {/* Current Workaround */}
            <Alert className="bg-green-50 border-green-500 border-2">
              <Zap className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>For Now: Test Mode Works!</strong><br/>
                You can continue development and testing with OTP: <code className="bg-green-200 px-2 py-1 rounded font-mono">123456</code><br/>
                Once backend is enabled, we'll switch to real SMS instantly.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => window.open('https://base44.com/docs/backend-functions', '_blank')}
                className="flex-1 bg-[#075E66] hover:bg-[#064d54] text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Backend Docs
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Once you enable backend functions in Dashboard → Settings, let me know and I\'ll create the proxy code!')}
                className="flex-1 border-[#F4B321] text-[#075E66] hover:bg-[#F4B321] hover:bg-opacity-10"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I've Enabled Backend
              </Button>
            </div>

            {/* Support Note */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              <p>Need help? Contact base44 support or ask me to create the backend code once functions are enabled.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}