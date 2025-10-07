
import React, { useState } from "react";
import { User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Shield, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            setError("Local login requires an email address. Please use the email of an existing admin.");
            setLoading(false);
            return;
        }

        await User.localLogin(identifier);
        console.log("✅ Local login successful. Redirecting to dashboard...");
        window.location.href = createPageUrl("Dashboard");
      } else {
        // Production Login Flow (existing code)
        // Check if identifier is email or phone
        const users = await User.list();
        const isEmail = identifier.includes('@');
        const adminUser = isEmail ? 
          users.find(u => u.email === identifier && u.role === 'admin') :
          users.find(u => u.phone === identifier && u.role === 'admin');
        
        if (!adminUser) {
          setError("No admin account found with these credentials.");
          setLoading(false);
          return;
        }

        // Login with Base44
        await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
      }
      
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-4 border-[#FFEB3B]">
        <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg border-b-4 border-[#FFEB3B]">
          <div className="flex justify-center mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
              alt="Cart Daddy"
              className="h-12"
            />
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-[#FFEB3B]" />
            Admin Login
          </CardTitle>
          <p className="text-sm text-white opacity-90 mt-2">Access admin dashboard</p>
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
                  placeholder="admin@cartdaddy.com or +91XXXXXXXXXX"
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
                  Login to Admin Panel
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t-2 border-[#075E66]">
              <Button
                variant="outline"
                onClick={() => window.location.href = createPageUrl("PortalSelector")}
                className="w-full border-2 border-[#075E66] text-[#075E66] hover:bg-[#075E66] hover:text-white font-bold"
              >
                Back to Portal Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
