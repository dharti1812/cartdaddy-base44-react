
import React, { useState, useEffect } from "react";
// import { User, DeliveryPartner } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Bike, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

export default function DeliveryBoyLogin() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Check if user is already logged in to Base44
      const user = await User.me();
      console.log("✅ User already logged in:", user.email);
      
      // Check if they have a delivery partner account
      const allPartners = await DeliveryPartner.list();
      const myPartners = allPartners.filter(p => p.email === user.email);
      
      if (myPartners.length > 0) {
        console.log("✅ Delivery partner account found, redirecting to portal...");
        window.location.href = createPageUrl("DeliveryBoyPortal");
        return;
      }
      
      console.log("⚠️ User logged in but no delivery partner account found");
      setError("No delivery partner account found for your account. Please sign up first.");
      setCheckingSession(false);
      
    } catch (err) {
      // User not logged in, show login form
      console.log("❌ No active session");
      setCheckingSession(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier) {
      setError("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Local Development Login Flow
      if (import.meta.env.DEV) {
        console.log("🛠️ Local dev mode detected. Using local login.");
        const isEmail = identifier.includes('@');
        if (!isEmail) {
            setError("Local login requires an email address. Please use the email of an existing delivery partner.");
            setLoading(false);
            return;
        }

        await User.localLogin(identifier);
        console.log("✅ Local login successful. Redirecting to portal...");
        window.location.href = createPageUrl("DeliveryBoyPortal");

      } else {
        // Production Login Flow (existing code)
        console.log("🔍 Checking for delivery partner account...");
      
        const allPartners = await DeliveryPartner.list();
        const isEmail = identifier.includes('@');
        
        let partner = null;
        if (isEmail) {
          partner = allPartners.find(p => p.email?.toLowerCase() === identifier.toLowerCase());
        } else {
          const cleanIdentifier = identifier.replace(/\D/g, '');
          partner = allPartners.find(p => {
            const cleanPhone = p.phone?.replace(/\D/g, '') || '';
            return cleanPhone === cleanIdentifier || 
                   cleanPhone.endsWith(cleanIdentifier) ||
                   cleanIdentifier.endsWith(cleanPhone);
          });
        }
        
        if (!partner) {
          setError("No delivery partner account found. Please sign up first.");
          setLoading(false);
          return;
        }
        
        console.log("✅ Partner account found:", partner.full_name);
        
        sessionStorage.setItem('delivery_partner_identifier', identifier);
        
        console.log("🔐 Redirecting to Base44 login...");
        await User.loginWithRedirect(window.location.origin + createPageUrl("DeliveryBoyPortal"));
      }
      
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Failed to login: " + err.message);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-xl">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-4 border-[#FFEB3B]">
        <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg border-b-4 border-[#FFEB3B]">
          <div className="flex justify-center mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
              alt="Cart Daddy"
              className="h-16"
            />
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Bike className="w-6 h-6 text-[#FFEB3B]" />
            Delivery Partner Login
          </CardTitle>
          <p className="text-sm text-white opacity-90 mt-2">Welcome back! Access your delivery portal</p>
        </CardHeader>

        <CardContent className="p-8 bg-white">
          {error && (
            <Alert variant="destructive" className="mb-4 border-2">
              <AlertDescription className="text-black">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="identifier" className="text-black font-bold">Email or Phone Number</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#075E66] w-5 h-5" />
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or +91XXXXXXXXXX"
                  className="pl-10 border-2 border-[#075E66] focus:border-[#FFEB3B]"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              disabled={loading || !identifier}
              className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  Login to Portal
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t-2 border-[#075E66]">
              <p className="text-sm text-black mb-3 font-bold">Don't have an account?</p>
              <Button
                variant="outline"
                onClick={() => window.location.href = createPageUrl("DeliveryPartnerOnboarding")}
                className="w-full border-2 border-[#075E66] text-[#075E66] hover:bg-[#075E66] hover:text-white font-bold"
              >
                Sign Up as Delivery Partner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
