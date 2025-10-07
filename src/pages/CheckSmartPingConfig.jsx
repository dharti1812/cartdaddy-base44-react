import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function CheckSmartPingConfig() {
  const [testResult, setTestResult] = useState(null);

  const currentConfig = {
    endpoint: "https://smartping.live/api/sms-api.php",
    method: "Username/Password in form data",
    userId: "89727834",
    apiToken: "1083729868b96901a652b3.83242267",
    senderId1: "CartDD",
    senderId2: "CDADDY",
    templates: {
      mobile: "1707175835848063202",
      order: "1707175696953213805"
    }
  };

  const officialPattern = {
    endpoint: "Should be from Entity Dashboard (e.g., https://<host>/api/...)",
    method: "Bearer Token in Authorization header",
    required: [
      "Access Token (from auth endpoint)",
      "PE ID (DLT Entity ID)",
      "Template ID (DLT approved)",
      "Header/Sender ID (DLT approved)",
      "Template Content or Variables"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white shadow-xl">
          <CardHeader className="bg-[#F4B321]">
            <CardTitle className="text-gray-900 text-2xl">
              🔍 SmartPing Configuration Check
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Current Implementation */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-orange-600" />
                Current Implementation (May be outdated)
              </h3>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Endpoint:</strong> <code>{currentConfig.endpoint}</code></p>
                <p><strong>Auth Method:</strong> {currentConfig.method}</p>
                <p><strong>User ID:</strong> {currentConfig.userId}</p>
                <p><strong>API Token:</strong> {currentConfig.apiToken.substring(0, 20)}...</p>
                <p><strong>Sender IDs:</strong> {currentConfig.senderId1}, {currentConfig.senderId2}</p>
                <p><strong>Templates:</strong> {currentConfig.templates.mobile}, {currentConfig.templates.order}</p>
              </div>
              <Alert className="bg-orange-50 border-orange-300">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <strong>⚠️ This may NOT follow SmartPing's official OMNI API pattern!</strong>
                </AlertDescription>
              </Alert>
            </div>

            {/* Official Pattern */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Official SmartPing OMNI API Pattern
              </h3>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Base URL:</strong> <code>{officialPattern.endpoint}</code></p>
                <p><strong>Auth Method:</strong> {officialPattern.method}</p>
                <p><strong>Required Parameters:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {officialPattern.required.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Required */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">📋 What You Need to Do</h3>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li className="font-semibold">
                    Login to SmartPing Dashboard:
                    <a href="https://smartping.live/entity/dashboard" target="_blank" rel="noopener noreferrer" 
                       className="ml-2 text-blue-600 hover:underline">
                      → Open Dashboard
                    </a>
                  </li>
                  
                  <li className="font-semibold">Find API Settings section and note down:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1 font-normal">
                      <li><strong>API Base URL</strong> (e.g., https://api.smartping.ai/v1 or similar)</li>
                      <li><strong>Access Token</strong> or <strong>Auth Endpoint</strong> to get token</li>
                      <li><strong>PE ID</strong> (DLT Principal Entity ID)</li>
                      <li><strong>Approved Headers/Sender IDs</strong> (CartDD, CDADDY)</li>
                      <li><strong>Template IDs</strong> with their exact content</li>
                    </ul>
                  </li>
                  
                  <li className="font-semibold">Download official manuals:
                    <a href="https://smartping.in/documents" target="_blank" rel="noopener noreferrer" 
                       className="ml-2 text-blue-600 hover:underline">
                      → SmartPing Documents
                    </a>
                    <ul className="list-disc list-inside ml-6 mt-2 font-normal">
                      <li>OMNI API Manual (for SMS)</li>
                      <li>OBD API Manual (for Voice Calls)</li>
                    </ul>
                  </li>
                  
                  <li className="font-semibold">
                    Check if there's an API section in your dashboard showing:
                    <ul className="list-disc list-inside ml-6 mt-2 font-normal">
                      <li>API endpoint URLs</li>
                      <li>Authentication credentials</li>
                      <li>Sample API calls</li>
                      <li>Webhook URLs for DLR (Delivery Reports)</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>

            {/* What to Share */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">📤 Information Needed from You</h3>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold">Please share these details from your SmartPing dashboard:</p>
                <div className="grid gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>API Base URL / Endpoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Authentication method (Bearer token? API Key?)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Access Token or how to generate it</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>PE ID (DLT Entity ID)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Template IDs with exact message format</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Sender IDs approval status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Sample API request from dashboard (if available)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">🧪 Quick Tests</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.open('https://smartping.live/entity/dashboard', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Open SmartPing Dashboard
                </Button>
                <Button 
                  onClick={() => window.open('https://smartping.in/documents', '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Download API Manuals
                </Button>
                <Button 
                  onClick={() => window.location.href = '/TestSARV'}
                  className="bg-[#F4B321] hover:bg-[#e0a020] text-gray-900"
                >
                  Test Current Config
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}