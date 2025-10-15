import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Store, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { API_BASE_URL } from "../../src/config";

export default function SellerLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  // Check if seller is already logged in
  const checkExistingSession = async () => {
    const token = localStorage.getItem("sellerToken");
    if (token) {
      // Optionally verify token validity via API
      try {
        const res = await fetch(`${API_BASE_URL}/api/seller/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Invalid session");
        window.location.href = createPageUrl("RetailerPortal");
        return;
      } catch {
        localStorage.removeItem("sellerToken");
      }
    }
    setCheckingSession(false);
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Please enter both email/phone and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/seller/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Save token and user info
      localStorage.setItem("sellerToken", data.token);
      localStorage.setItem("sellerUser", JSON.stringify(data.user));

      console.log("✅ Login successful:", data.user);
      window.location.href = createPageUrl("RetailerPortal");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Something went wrong during login");
    } finally {
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
            <Store className="w-6 h-6 text-[#FFEB3B]" />
            Seller Login
          </CardTitle>
          <p className="text-sm text-white opacity-90 mt-2">
            Welcome back! Access your seller portal
          </p>
        </CardHeader>

        <CardContent className="p-8 bg-white">
          {error && (
            <Alert variant="destructive" className="mb-4 border-2">
              <AlertDescription className="text-black">{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            <div>
              <Label htmlFor="identifier" className="text-black font-bold">
                Email or Phone Number
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#075E66] w-5 h-5" />
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or +91XXXXXXXXXX"
                  className="pl-10 border-2 border-[#075E66] focus:border-[#FFEB3B]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-black font-bold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-3 border-2 border-[#075E66] focus:border-[#FFEB3B]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold py-6 border-2 border-[#075E66]"
            >
              {loading ? "Logging in..." : "Login to Portal"}
              {!loading && <ArrowRight className="w-5 h-5 ml-2 inline" />}
            </Button>
          </form>

          <div className="text-center pt-4 border-t-2 border-[#075E66]">
            <p className="text-sm text-black mb-3 font-bold">
              Don't have an account?
            </p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = createPageUrl("RetailerOnboarding"))}
              className="w-full border-2 border-[#075E66] text-[#075E66] hover:bg-[#075E66] hover:text-white font-bold"
            >
              Sign Up as Seller
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
