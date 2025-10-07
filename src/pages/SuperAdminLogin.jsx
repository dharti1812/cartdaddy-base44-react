
import React, { useState } from "react";
import { User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SuperAdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!identifier) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (import.meta.env.DEV) {
        console.log("🛠️ Local dev mode detected. Using local login for Super Admin.");
        const isEmail = identifier.includes('@');
        if (!isEmail) {
            setError("Local login requires an email address. Please use the email of an existing super admin.");
            setLoading(false);
            return;
        }

        await User.localLogin(identifier);
        console.log("✅ Local login successful. Redirecting to dashboard...");
        window.location.href = createPageUrl("Dashboard");
      } else {
        sessionStorage.setItem('superadmin_identifier', identifier);
        await User.loginWithRedirect(window.location.origin + createPageUrl("Dashboard"));
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Failed to login: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl rounded-xl border-t-4 border-yellow-400">
        <CardHeader className="text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
            alt="Cart Daddy Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold text-gray-800">Super Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your super admin email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="py-6 text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#F4B321] hover:bg-[#e0a020] text-gray-900 font-bold py-6 text-base"
          >
            {loading ? "Logging In..." : "Login"}
          </Button>
          <p className="text-center text-xs text-gray-500 mt-4">
            This login is for super administrators only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
