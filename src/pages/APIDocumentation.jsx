import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Code, Server, Globe, MapPin } from "lucide-react";

export default function APIDocumentation() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#205e61] mb-2">API Integration & Cost Analysis</h1>
          <p className="text-gray-600">Complete breakdown for your existing Hostinger infrastructure</p>
        </div>

        <Alert className="mb-6 bg-[#f5b736] bg-opacity-10 border-[#f5b736]">
          <CheckCircle className="w-5 h-5 text-[#f5b736]" />
          <AlertDescription className="text-gray-900">
            <strong>✅ You have Domain + Server</strong> - This saves you ₹500-1000/month in hosting costs!
          </AlertDescription>
        </Alert>

        {/* Google Maps Cost Analysis */}
        <Card className="mb-6 border-2 border-[#205e61]">
          <CardHeader className="bg-gradient-to-r from-[#205e61] to-[#f5b736] text-white">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Google Maps API Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Cost Per Delivery (Google Maps)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Distance Matrix API call:</span>
                  <span className="font-semibold text-blue-900">$0.005 (₹0.42)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Geocoding API call:</span>
                  <span className="font-semibold text-blue-900">$0.005 (₹0.42)</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                  <span className="text-blue-900 font-bold">Total per delivery:</span>
                  <span className="font-bold text-blue-900 text-lg">₹0.84</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Monthly Cost Examples</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-800">100 deliveries/month:</span>
                  <span className="font-semibold text-green-900">₹84</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">500 deliveries/month:</span>
                  <span className="font-semibold text-green-900">₹420</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">1000 deliveries/month:</span>
                  <span className="font-semibold text-green-900">₹840</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">5000 deliveries/month:</span>
                  <span className="font-semibold text-green-900">₹4,200</span>
                </div>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                <strong>Free Tier:</strong> Google Maps gives $200/month free credit = ~24,000 API calls = ~12,000 deliveries FREE per month!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* FREE Alternatives to Google Maps */}
        <Card className="mb-6 border-2 border-green-500">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              FREE Alternatives to Google Maps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            {/* Option 1: OpenStreetMap */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-green-900 text-lg">1. OpenStreetMap + OSRM</h4>
                <Badge className="bg-green-600 text-white">100% FREE</Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Service:</strong> OpenStreetMap (OSM) for geocoding + OSRM for routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Cost:</strong> Completely FREE, unlimited usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>API:</strong> Nominatim (geocoding) + OSRM (routing/distance)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Accuracy:</strong> Good for Indian addresses (95%+ accuracy)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Self-hosted option:</strong> Yes (if you want more control)</span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <p className="text-xs font-mono text-gray-700">
                  Geocoding: https://nominatim.openstreetmap.org/<br/>
                  Routing: http://router.project-osrm.org/
                </p>
              </div>
            </div>

            {/* Option 2: MapBox */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-blue-900 text-lg">2. Mapbox</h4>
                <Badge className="bg-blue-600 text-white">FREE TIER</Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Free Tier:</strong> 100,000 requests/month FREE</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>That's:</strong> ~50,000 deliveries/month (geocoding + distance)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Accuracy:</strong> Excellent for Indian cities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>After free tier:</strong> $0.50 per 1000 requests (cheaper than Google)</span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                <p className="text-xs font-mono text-gray-700">
                  Website: https://www.mapbox.com/<br/>
                  API Docs: https://docs.mapbox.com/api/
                </p>
              </div>
            </div>

            {/* Option 3: HERE Maps */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-purple-900 text-lg">3. HERE Maps</h4>
                <Badge className="bg-purple-600 text-white">FREE TIER</Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Free Tier:</strong> 250,000 transactions/month FREE</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>That's:</strong> ~125,000 deliveries/month (massive!)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Coverage:</strong> Excellent India coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Pricing:</strong> Very competitive after free tier</span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-xs font-mono text-gray-700">
                  Website: https://developer.here.com/<br/>
                  Free signup: https://platform.here.com/sign-up
                </p>
              </div>
            </div>

            {/* Option 4: Simple Math (No API) */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-lg">4. Haversine Formula (DIY)</h4>
                <Badge className="bg-gray-600 text-white">100% FREE</Badge>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Method:</strong> Calculate straight-line distance using lat/lng</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Cost:</strong> FREE - no API needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Limitation:</strong> Less accurate (doesn't account for roads)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Good for:</strong> Rough distance estimates, geofencing</span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <p className="text-xs font-mono text-gray-700">
                  // JavaScript implementation available<br/>
                  // Multiply straight-line distance by 1.3x for road distance estimate
                </p>
              </div>
            </div>

            <Alert className="bg-green-50 border-green-500 border-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription>
                <p className="font-bold text-green-900 mb-2">💡 My Recommendation for Cart Daddy:</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li><strong>Start with:</strong> HERE Maps (250K free transactions/month)</li>
                  <li><strong>Backup:</strong> OpenStreetMap + OSRM (unlimited free)</li>
                  <li><strong>For geofencing only:</strong> Haversine formula (completely free)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Revised Cost Analysis */}
        <Card className="mb-6 border-2 border-[#f5b736]">
          <CardHeader className="bg-gradient-to-r from-[#f5b736] to-[#205e61] text-white">
            <CardTitle>💰 Revised Monthly Cost (With Your Server)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Domain + Hostinger Server</span>
                <span className="font-semibold text-green-600">₹0 (Already paid)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">SMS OTP (1000 verifications/month)</span>
                <span className="font-semibold">₹150</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Email OTP (5000 emails/month)</span>
                <span className="font-semibold text-green-600">₹0 (Free tier)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">GSTIN Verification (500/month)</span>
                <span className="font-semibold">₹1,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Bank Verification (500/month)</span>
                <span className="font-semibold">₹1,500</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Payment Gateway (2% of ₹5L GMV)</span>
                <span className="font-semibold">₹10,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">WhatsApp Notifications (2000/month)</span>
                <span className="font-semibold">₹500</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Maps API (Use HERE Maps free tier)</span>
                <span className="font-semibold text-green-600">₹0 (Free up to 125K deliveries)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">SSL Certificate (Let's Encrypt)</span>
                <span className="font-semibold text-green-600">₹0 (Free)</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-[#205e61] text-white px-3 rounded-lg mt-3">
                <span className="font-bold text-lg">Total Monthly Cost</span>
                <span className="font-bold text-2xl text-[#f5b736]">₹13,150</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded-lg border border-green-200">
                <span className="font-semibold text-green-900">You're Saving (vs cloud hosting)</span>
                <span className="font-bold text-green-600">₹500-1000/month</span>
              </div>
            </div>
            
            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>💡 Cost Optimization Tips:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Use HERE Maps instead of Google Maps = Save ₹840-4200/month</li>
                  <li>• Batch SMS/WhatsApp messages = Save 20-30%</li>
                  <li>• Payment gateway: Negotiate rates after ₹10L GMV</li>
                  <li>• Email: Stay on free tier (SendGrid/Mailgun)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="mt-6 p-4 bg-[#f5b736] bg-opacity-10 border-2 border-[#f5b736] rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">📊 Scaling Cost Projections:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">At 100 deliveries/month:</span>
                  <span className="font-semibold text-[#205e61]">~₹13,150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">At 1000 deliveries/month:</span>
                  <span className="font-semibold text-[#205e61]">~₹25,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">At 5000 deliveries/month:</span>
                  <span className="font-semibold text-[#205e61]">~₹60,000</span>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  * Primarily payment gateway fees (2% of GMV) as you scale
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Steps for Hostinger */}
        <Card className="mb-6 border-2 border-[#205e61]">
          <CardHeader className="bg-gradient-to-r from-[#205e61] to-teal-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Server className="w-6 h-6" />
              Deployment Steps for Your Hostinger Server
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Contact base44 support for code export</p>
                  <p className="text-gray-600 text-xs mt-1">Use the feedback button in your dashboard</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Set up Node.js on Hostinger VPS</p>
                  <p className="text-gray-600 text-xs mt-1">Requires VPS or Cloud plan (shared hosting won't work)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Set up PostgreSQL database</p>
                  <p className="text-gray-600 text-xs mt-1">Or use Supabase free tier (managed PostgreSQL)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">4</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Configure environment variables</p>
                  <p className="text-gray-600 text-xs mt-1">API keys for all services (SMS, email, payment, etc.)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">5</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Point domain to server</p>
                  <p className="text-gray-600 text-xs mt-1">Update DNS A record to point to Hostinger IP</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">6</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Install SSL certificate</p>
                  <p className="text-gray-600 text-xs mt-1">Use Let's Encrypt (free) via Certbot</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">7</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Integrate all APIs</p>
                  <p className="text-gray-600 text-xs mt-1">SMS, Email, GSTIN, Bank, Payment Gateway, Maps</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="bg-[#f5b736] text-gray-900 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">8</Badge>
                <div>
                  <p className="font-semibold text-gray-900">Test thoroughly</p>
                  <p className="text-gray-600 text-xs mt-1">Test complete retailer onboarding and order flow</p>
                </div>
              </li>
            </ol>

            <Alert className="mt-6 bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                <strong>⏱️ Timeline:</strong> Expect 2-3 weeks for complete setup and testing. Consider hiring a developer if you're not technical.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}