
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Code, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntegrationGuide() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }) => (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyCode(code, id)}
          className="bg-white/10 hover:bg-white/20"
        >
          {copiedCode === id ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#205e61] mb-2">📚 Step-by-Step Integration Guide</h1>
          <p className="text-gray-600">Complete code examples for all APIs - Copy, paste, and configure</p>
        </div>

        <Alert className="mb-6 bg-[#f5b736] bg-opacity-10 border-[#f5b736]">
          <CheckCircle className="w-5 h-5 text-[#f5b736]" />
          <AlertDescription className="text-gray-900">
            <strong>🎯 Quick Start:</strong> Follow each tab in order. Get API keys from providers, replace placeholders, and test!
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="here-maps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white border border-gray-200">
            <TabsTrigger value="here-maps">HERE Maps</TabsTrigger>
            <TabsTrigger value="sms">SMS OTP</TabsTrigger>
            <TabsTrigger value="email">Email OTP</TabsTrigger>
            <TabsTrigger value="gstin">GSTIN</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          {/* HERE Maps Integration */}
          <TabsContent value="here-maps">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>🗺️ HERE Maps API Integration</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Step 1: Get API Key */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 1</Badge>
                    Get FREE API Key
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Go to <a href="https://platform.here.com/sign-up" target="_blank" rel="noopener noreferrer" className="text-[#205e61] font-semibold underline">HERE Developer Portal</a></li>
                    <li>Sign up for FREE account (no credit card required)</li>
                    <li>Create a new project</li>
                    <li>Generate REST API Key</li>
                    <li>Copy your API key (looks like: <code className="bg-gray-100 px-2 py-1 rounded text-xs">YOUR_API_KEY_HERE</code>)</li>
                  </ol>
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-900 text-sm">
                      <strong>Free Tier:</strong> 250,000 transactions/month = ~125,000 deliveries FREE!
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 2: Backend Code */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 2</Badge>
                    Backend API Functions (Node.js)
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">Create <code className="bg-gray-100 px-2 py-1 rounded">server/hereMapsAPI.js</code></p>
                  
                  <CodeBlock id="here-backend" code={`const axios = require('axios');

const HERE_API_KEY = process.env.HERE_API_KEY; // Add to your .env file

// Geocode address to lat/lng
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://geocode.search.hereapi.com/v1/geocode', {
      params: {
        q: address,
        apiKey: HERE_API_KEY,
        limit: 1
      }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const location = response.data.items[0].position;
      return {
        success: true,
        lat: location.lat,
        lng: location.lng,
        formatted_address: response.data.items[0].address.label
      };
    }
    
    return { success: false, error: 'Address not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Calculate distance between two points
async function calculateDistance(origin, destination) {
  try {
    // origin and destination should be { lat, lng } objects
    const response = await axios.get('https://router.hereapi.com/v8/routes', {
      params: {
        transportMode: 'car',
        origin: \`\${origin.lat},\${origin.lng}\`,
        destination: \`\${destination.lat},\${destination.lng}\`,
        return: 'summary',
        apiKey: HERE_API_KEY
      }
    });
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0].sections[0];
      return {
        success: true,
        distance_m: route.summary.length, // in meters
        distance_km: (route.summary.length / 1000).toFixed(2), // in km
        duration_sec: route.summary.duration, // in seconds
        duration_min: Math.ceil(route.summary.duration / 60) // in minutes
      };
    }
    
    return { success: false, error: 'Route not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check if retailer is within geofence
async function isWithinGeofence(retailerLocation, orderLocation, radiusMeters = 5000) {
  const distance = await calculateDistance(retailerLocation, orderLocation);
  
  if (distance.success) {
    return {
      success: true,
      within_geofence: distance.distance_m <= radiusMeters,
      distance_km: distance.distance_km,
      estimated_time_min: distance.duration_min
    };
  }
  
  return distance;
}

module.exports = {
  geocodeAddress,
  calculateDistance,
  isWithinGeofence
};`} />
                </div>

                {/* Step 3: Environment Variables */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 3</Badge>
                    Add to .env File
                  </h3>
                  
                  <CodeBlock id="here-env" code={`# HERE Maps API
HERE_API_KEY=YOUR_HERE_API_KEY_HERE`} />
                </div>

                {/* Step 4: Usage Example */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 4</Badge>
                    Usage in Your App
                  </h3>
                  
                  <CodeBlock id="here-usage" code={`const { geocodeAddress, calculateDistance, isWithinGeofence } = require('./hereMapsAPI');

// Example: Geocode customer address
const customerAddress = "123 Main St, Mumbai, Maharashtra 400001";
const geocoded = await geocodeAddress(customerAddress);
console.log(geocoded);
// { success: true, lat: 19.0760, lng: 72.8777, formatted_address: "..." }

// Example: Calculate distance between retailer and customer
const retailerLoc = { lat: 19.0760, lng: 72.8777 };
const customerLoc = { lat: 19.1136, lng: 72.8697 };
const distance = await calculateDistance(retailerLoc, customerLoc);
console.log(distance);
// { success: true, distance_km: "4.5", duration_min: 15 }

// Example: Check if retailer is within 5km geofence
const withinRange = await isWithinGeofence(retailerLoc, customerLoc, 5000);
console.log(withinRange);
// { success: true, within_geofence: true, distance_km: "4.5", estimated_time_min: 15 }`} />
                </div>

                {/* Alternative: Haversine Formula */}
                <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">🎯 Bonus: FREE Haversine Formula (No API needed)</h4>
                  <p className="text-sm text-blue-800 mb-3">Use this for geofencing only (less accurate but 100% free)</p>
                  
                  <CodeBlock id="haversine" code={`// Calculate straight-line distance (no API needed)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return {
    distance_km: distance.toFixed(2),
    // Multiply by 1.3 to estimate road distance
    estimated_road_distance_km: (distance * 1.3).toFixed(2)
  };
}

// Usage
const dist = haversineDistance(19.0760, 72.8777, 19.1136, 72.8697);
console.log(dist); 
// { distance_km: "4.3", estimated_road_distance_km: "5.6" }`} />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS OTP Integration */}
          <TabsContent value="sms">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>📱 SMS OTP Integration (MSG91)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Step 1 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 1</Badge>
                    Get MSG91 API Key
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Go to <a href="https://msg91.com/" target="_blank" rel="noopener noreferrer" className="text-[#205e61] font-semibold underline">MSG91.com</a></li>
                    <li>Sign up for account</li>
                    <li>Complete KYC (required by TRAI)</li>
                    <li>Get your AuthKey from dashboard</li>
                    <li>Create OTP template with variable placeholder for OTP code</li>
                    <li>Note your Template ID</li>
                  </ol>
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm">
                      <strong>Cost:</strong> ₹0.15 per SMS | Start with ₹100 test credit
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 2 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 2</Badge>
                    Backend Code
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">Create <code className="bg-gray-100 px-2 py-1 rounded">server/smsAPI.js</code></p>
                  
                  <CodeBlock id="sms-code" code={`const axios = require('axios');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Send OTP
async function sendPhoneOTP(phone) {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send via MSG91
    const response = await axios.get('https://control.msg91.com/api/v5/otp', {
      params: {
        authkey: MSG91_AUTH_KEY,
        template_id: MSG91_TEMPLATE_ID,
        mobile: phone,
        otp: otp
      }
    });
    
    if (response.data.type === 'success') {
      // Store OTP with 5-minute expiry
      otpStore.set(phone, {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Failed to send OTP'
    };
  } catch (error) {
    console.error('SMS OTP Error:', error.message);
    return {
      success: false,
      message: 'Failed to send OTP'
    };
  }
}

// Verify OTP
async function verifyPhoneOTP(phone, otp) {
  try {
    const stored = otpStore.get(phone);
    
    if (!stored) {
      return {
        success: false,
        message: 'OTP not found or expired'
      };
    }
    
    if (Date.now() > stored.expires) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP expired'
      };
    }
    
    if (stored.otp === otp) {
      otpStore.delete(phone);
      return {
        success: true,
        message: 'Phone verified successfully'
      };
    }
    
    return {
      success: false,
      message: 'Invalid OTP'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Verification failed'
    };
  }
}

module.exports = {
  sendPhoneOTP,
  verifyPhoneOTP
};`} />
                </div>

                {/* Step 3 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 3</Badge>
                    Add to .env
                  </h3>
                  
                  <CodeBlock id="sms-env" code={`# MSG91 SMS API
MSG91_AUTH_KEY=YOUR_MSG91_AUTH_KEY
MSG91_TEMPLATE_ID=YOUR_TEMPLATE_ID`} />
                </div>

                {/* Alternative Provider */}
                <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <h4 className="font-bold text-purple-900 mb-2">🔄 Alternative: Twilio</h4>
                  <CodeBlock id="twilio" code={`const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOTPTwilio(phone, otp) {
  await client.messages.create({
    body: \`Your Cart Daddy verification code is \${otp}\`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}`} />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Email OTP Integration */}
          <TabsContent value="email">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>📧 Email OTP Integration (SendGrid)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 1</Badge>
                    Get SendGrid API Key (FREE)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Go to <a href="https://sendgrid.com/" target="_blank" rel="noopener noreferrer" className="text-[#205e61] font-semibold underline">SendGrid.com</a></li>
                    <li>Sign up for FREE account</li>
                    <li>Verify your email sender address</li>
                    <li>Generate API Key (Settings → API Keys)</li>
                    <li>Copy API Key</li>
                  </ol>
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-900 text-sm">
                      <strong>Free Tier:</strong> 100 emails/day forever FREE!
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 2</Badge>
                    Backend Code
                  </h3>
                  
                  <CodeBlock id="email-code" code={`const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const otpStore = new Map();

async function sendEmailOTP(email) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Cart Daddy - Email Verification',
      text: \`Your Cart Daddy verification code is \${otp}\`,
      html: \`
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #205e61;">Cart Daddy</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #f5b736; font-size: 32px; letter-spacing: 5px;">\${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      \`
    };
    
    await sgMail.send(msg);
    
    otpStore.set(email, {
      otp: otp,
      expires: Date.now() + 5 * 60 * 1000
    });
    
    return {
      success: true,
      message: 'OTP sent to email'
    };
  } catch (error) {
    console.error('Email OTP Error:', error.message);
    return {
      success: false,
      message: 'Failed to send email'
    };
  }
}

async function verifyEmailOTP(email, otp) {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return { success: false, message: 'OTP expired' };
  }
  
  if (stored.otp === otp) {
    otpStore.delete(email);
    return { success: true, message: 'Email verified' };
  }
  
  return { success: false, message: 'Invalid OTP' };
}

module.exports = {
  sendEmailOTP,
  verifyEmailOTP
};`} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 3</Badge>
                    Add to .env
                  </h3>
                  
                  <CodeBlock id="email-env" code={`# SendGrid Email API
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@cartdaddy.in`} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge className="bg-[#f5b736] text-gray-900">Step 4</Badge>
                    Install Package
                  </h3>
                  
                  <CodeBlock id="email-install" code={`npm install @sendgrid/mail`} />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* GSTIN Verification */}
          <TabsContent value="gstin">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>🏢 GSTIN Verification API</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Recommended Provider: RapidAPI</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Go to <a href="https://rapidapi.com/hub" target="_blank" rel="noopener noreferrer" className="text-[#205e61] font-semibold underline">RapidAPI Hub</a></li>
                    <li>Search for "GST Verification" or "GSTIN Verification"</li>
                    <li>Subscribe to API (many have free tiers)</li>
                    <li>Copy your RapidAPI Key</li>
                  </ol>
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm">
                      <strong>Cost:</strong> ₹2 per verification | Or use free tier for testing
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <CodeBlock id="gstin-code" code={`const axios = require('axios');

async function verifyGSTIN(gstin) {
  try {
    const response = await axios.get(\`https://gst-verification.p.rapidapi.com/v3/tasks/sync/verify_with_source/ind_gst\`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'gst-verification.p.rapidapi.com'
      },
      params: {
        task_id: Date.now().toString(),
        group_id: Date.now().toString(),
        data: {
          gstin: gstin
        }
      }
    });
    
    if (response.data.status === 'completed' && response.data.result.source_output) {
      const gstData = response.data.result.source_output;
      return {
        success: true,
        data: {
          business_name: gstData.legal_name,
          trade_name: gstData.trade_name,
          address: gstData.principal_place_of_business_address,
          state: gstData.principal_place_of_business_state,
          registration_date: gstData.date_of_registration,
          status: gstData.status
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid GSTIN or verification failed'
    };
  } catch (error) {
    console.error('GSTIN Verification Error:', error.message);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
}

module.exports = { verifyGSTIN };`} />
                </div>

                <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <h4 className="font-bold text-amber-900 mb-2">⚠️ For Testing Only (Mock Function)</h4>
                  <p className="text-sm text-amber-800 mb-3">Use this during development without API costs:</p>
                  <CodeBlock id="gstin-mock" code={`async function verifyGSTIN(gstin) {
  // Simple format validation
  if (gstin.length !== 15) {
    return { success: false, message: 'GSTIN must be 15 characters' };
  }
  
  // Mock successful verification for testing
  return {
    success: true,
    data: {
      business_name: "Sample Business Pvt Ltd",
      trade_name: "Sample Store",
      address: "123 Sample Street, Sample City",
      state: "Maharashtra"
    }
  };
}`} />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Verification */}
          <TabsContent value="bank">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>🏦 Bank Account Verification API</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Recommended: Cashfree or Razorpay</h3>
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm">
                      <strong>Cost:</strong> ₹3 per verification | Instant penny-drop verification
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Option 1: Cashfree Bank Verification</h4>
                  <CodeBlock id="bank-cashfree" code={`const axios = require('axios');

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

async function verifyBankAccount(accountNumber, ifsc) {
  try {
    // Get auth token
    const authResponse = await axios.post('https://payout-gamma.cashfree.com/payout/v1/authorize', {
      clientId: CASHFREE_CLIENT_ID,
      clientSecret: CASHFREE_CLIENT_SECRET
    });
    
    const token = authResponse.data.data.token;
    
    // Verify bank account
    const verifyResponse = await axios.post(
      'https://payout-gamma.cashfree.com/payout/v1/validation/bankDetails',
      {
        accountNumber: accountNumber,
        ifsc: ifsc
      },
      {
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (verifyResponse.data.status === 'SUCCESS') {
      return {
        success: true,
        data: {
          account_holder_name: verifyResponse.data.data.nameAtBank,
          bank_name: verifyResponse.data.data.bankName,
          branch: verifyResponse.data.data.branchName,
          is_valid: true
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid bank account details'
    };
  } catch (error) {
    console.error('Bank Verification Error:', error.message);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
}

module.exports = { verifyBankAccount };`} />
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Option 2: Razorpay Fund Account Validation</h4>
                  <CodeBlock id="bank-razorpay" code={`const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function verifyBankAccount(accountNumber, ifsc) {
  try {
    const validation = await razorpay.fundAccount.create({
      account_type: 'bank_account',
      bank_account: {
        name: 'Retailer Name', // You can put any name for validation
        account_number: accountNumber,
        ifsc: ifsc
      }
    });
    
    if (validation.active) {
      return {
        success: true,
        data: {
          account_holder_name: validation.bank_account.name,
          bank_name: validation.bank_account.bank_name,
          is_valid: true
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid bank account'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}`} />
                </div>

                <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <h4 className="font-bold text-amber-900 mb-2">⚠️ For Testing Only (Mock)</h4>
                  <CodeBlock id="bank-mock" code={`async function verifyBankAccount(accountNumber, ifsc) {
  // Simple validation
  if (accountNumber.length < 9 || ifsc.length !== 11) {
    return { success: false, message: 'Invalid format' };
  }
  
  // Mock verification
  return {
    success: true,
    data: {
      account_holder_name: "SAMPLE ACCOUNT HOLDER",
      bank_name: "State Bank of India",
      branch: "Main Branch"
    }
  };
}`} />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Gateway Tab */}
          <TabsContent value="payment">
            <Card className="border-2 border-[#205e61]">
              <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
                <CardTitle>💳 Payment Link System (For Retailers)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <Alert className="bg-blue-50 border-2 border-blue-500">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong className="text-lg">🎯 Important: Cart Daddy does NOT process payments!</strong>
                    <div className="mt-3 space-y-2 text-sm">
                      <p>• Each <strong>RETAILER</strong> uses their own payment gateway (Razorpay/Paytm/PhonePe)</p>
                      <p>• Retailer generates payment link from their gateway</p>
                      <p>• Cart Daddy platform sends that link to customer via SMS/WhatsApp</p>
                      <p>• Customer pays <strong>directly to retailer</strong></p>
                      <p>• Cart Daddy takes commission from delivery fee, not from payment</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h3 className="font-bold text-green-900 mb-3 text-xl">✅ NO Payment Gateway Integration Needed!</h3>
                  <p className="text-green-800 mb-3">Cart Daddy platform only needs to:</p>
                  <ol className="list-decimal list-inside space-y-2 text-green-900 ml-4">
                    <li><strong>Accept payment link URL</strong> from retailer (just text input)</li>
                    <li><strong>Send that link</strong> to customer via SMS/WhatsApp</li>
                    <li><strong>Track if customer clicked/paid</strong> (optional - via webhook)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Payment Flow Diagram</h3>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                        <div className="flex-1">
                          <p className="font-semibold">Customer places order on CartDaddy.in</p>
                          <p className="text-sm text-gray-600">Order amount: ₹1000</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                        <div className="flex-1">
                          <p className="font-semibold">Retailer accepts order in Portal</p>
                          <p className="text-sm text-gray-600">Has 150 seconds to generate payment link</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                        <div className="flex-1">
                          <p className="font-semibold">Retailer opens their Razorpay/Paytm app</p>
                          <p className="text-sm text-gray-600">Creates payment link for ₹1000 in their own gateway</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                        <div className="flex-1">
                          <p className="font-semibold">Retailer pastes link in Cart Daddy Portal</p>
                          <p className="text-sm text-gray-600">Example: https://rzp.io/i/abc123xyz</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                        <div className="flex-1">
                          <p className="font-semibold">Cart Daddy sends link to customer</p>
                          <p className="text-sm text-gray-600">Via SMS/WhatsApp: "Pay here: https://rzp.io/i/abc123xyz"</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">6</div>
                        <div className="flex-1">
                          <p className="font-semibold">Customer clicks & pays ₹1000</p>
                          <p className="text-sm text-gray-600">Money goes DIRECTLY to retailer's account</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">7</div>
                        <div className="flex-1">
                          <p className="font-semibold">Retailer delivers order</p>
                          <p className="text-sm text-gray-600">Cart Daddy deducts ₹30 commission from delivery fee later</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <h4 className="font-bold text-amber-900 mb-2">💡 Why This Approach?</h4>
                  <ul className="space-y-2 text-sm text-amber-900">
                    <li>✅ <strong>No PCI compliance needed</strong> - Cart Daddy never handles card data</li>
                    <li>✅ <strong>Retailers keep their existing gateway</strong> - No forced migration</li>
                    <li>✅ <strong>Lower costs</strong> - No payment gateway fees for Cart Daddy</li>
                    <li>✅ <strong>Faster setup</strong> - No payment integration needed</li>
                    <li>✅ <strong>Trust</strong> - Customers pay familiar brands (Razorpay, Paytm)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">🔧 What YOU Need to Build</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">1. SMS/WhatsApp Integration (Already in guide above)</h4>
                      <p className="text-sm text-gray-600">To send payment link to customer</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">2. Payment Link Input Field (Already built!)</h4>
                      <p className="text-sm text-gray-600">In RetailerPortal → AvailableOrders component</p>
                      <code className="block bg-white p-2 rounded text-xs mt-2">pages/RetailerPortal.js - Dialog accepts payment link URL</code>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">3. Send Link Function (Simple HTTP call)</h4>
                      <CodeBlock id="send-link" code={`// After retailer submits payment link
async function sendPaymentLinkToCustomer(order) {
  const message = \`Hi \${order.customer_name}, pay for your order here: \${order.paylink_url}\`;
  
  // Send via SMS
  await sendSMS(order.customer_masked_contact, message);
  
  // Send via WhatsApp (optional)
  await sendWhatsApp(order.customer_masked_contact, message);
}`} />
                    </div>
                  </div>
                </div>

                <Alert className="bg-green-50 border-2 border-green-500">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong className="text-lg">🎉 Summary: SKIP Payment Gateway Integration!</strong>
                    <p className="mt-2">You only need SMS/WhatsApp APIs (covered in previous tabs). Retailers handle their own payments!</p>
                  </AlertDescription>
                </Alert>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Final Deployment Checklist */}
        <Card className="mt-8 border-2 border-[#f5b736]">
          <CardHeader className="bg-gradient-to-r from-[#f5b736] to-[#205e61] text-white">
            <CardTitle>✅ Final Deployment Checklist</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">HERE Maps API key added to .env</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">MSG91 SMS API configured and tested</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">SendGrid email API configured</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">GSTIN verification API integrated</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Bank verification API integrated</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Razorpay payment gateway configured</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">All environment variables set in .env</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">SSL certificate installed on Hostinger</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Domain pointed to Hostinger server</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Test complete retailer onboarding flow</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Test order creation and assignment</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-gray-700">Test payment link generation</span>
              </div>
            </div>

            <Alert className="mt-6 bg-green-50 border-green-500 border-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription>
                <p className="font-bold text-green-900 mb-2">🚀 Ready to Deploy!</p>
                <p className="text-sm text-green-800">
                  Once all items are checked, your Cart Daddy platform is ready to go live. 
                  Contact base44 support for code export and deployment assistance.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
