import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bike } from "lucide-react";
import { createPageUrl } from "@/utils";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";
import { AuthApi } from "@/components/utils/authApi";

export default function DeliveryPartnerLogin() {
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

    if (!locationGranted) {
      return;
    }

    const lat = sessionStorage.getItem("lat");
    const lng = sessionStorage.getItem("lng");

    if (!lat || !lng) {
      setError("⚠️ Location access required.");
      return;
    }

    if (!identifier || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userType = "delivery_boy";
      const loginResponse = await AuthApi.login(identifier, password, userType);

      const token = loginResponse.access_token;
      const user = loginResponse.user;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      const tokenValidation = await AuthApi.validateToken(token);
      if (!tokenValidation.valid) {
        throw new Error("Invalid or tampered token");
      }

      const roleCheck = await AuthApi.checkRole(token);
      if (!roleCheck.authorized) {
        throw new Error("Unauthorized access");
      }

      window.location.href = createPageUrl("DeliveryBoyPortal");
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
          <Bike className="mx-auto mb-4 w-12 h-12 text-yellow-400" />
          <CardTitle className="text-2xl font-bold text-gray-800">
            Delivery Partner Login
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter your email or phone"
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
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-6 text-base"
          >
            {loading ? "Logging In..." : "Login"}
          </Button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don’t have an account?{" "}
            <button
              onClick={() =>
                (window.location.href = createPageUrl(
                  "DeliveryPartnerOnboarding"
                ))
              }
              className="text-yellow-400 underline"
            >
              Sign Up
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
