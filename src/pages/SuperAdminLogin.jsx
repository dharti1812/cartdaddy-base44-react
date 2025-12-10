import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { AuthApi } from "@/components/utils/authApi";

export default function SuperAdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const locationGranted = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sessionStorage.setItem("lat", position.coords.latitude);
          sessionStorage.setItem("lng", position.coords.longitude);
          resolve(true);
        },
        () => {
          setError("⚠️ Please allow location access to continue.");
          resolve(false);
        }
      );
    });

    if (!identifier || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userType = "admin";
      const loginResponse = await AuthApi.login(identifier, password, userType);

      const token = loginResponse.access_token;
      const user = loginResponse.user;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      // Step 1: Validate Token
      const tokenValidation = await AuthApi.validateToken(token);
      if (!tokenValidation.valid) {
        throw new Error("Invalid or tampered token");
      }

      // Step 2: Check Role
      const roleCheck = await AuthApi.checkRole(token);
      if (!roleCheck.authorized) {
        throw new Error("Unauthorized access");
      }

      // Step 3: Redirect
      window.location.href = createPageUrl("Dashboard");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Login failed: " + err.message);
    } finally {
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
          <CardTitle className="text-2xl font-bold text-gray-800">
            Super Admin Login
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your super admin email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="py-6 text-base"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />

            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="py-6 text-base"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
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
