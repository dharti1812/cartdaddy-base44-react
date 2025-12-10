import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IndianRupee, Info } from "lucide-react";
import { OrderApi } from "@/components/utils/orderApi";

/** normalize value coming from backend (1/"1"/true/"true" => true) */
const toBool = (v) => {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return false;
};

export default function CODToggle({ retailerId, retailerProfile, onUpdate }) {
  const [toggling, setToggling] = useState(false);
  const [checked, setChecked] = useState(toBool(retailerProfile?.accepts_cod));

  // sync once when prop changes (but don't stomp ongoing optimistic update)
  useEffect(() => {
    // if parent hasn't provided a value yet, ignore
    if (typeof retailerProfile?.accepts_cod === "undefined" || retailerProfile === null) return;
    setChecked(toBool(retailerProfile.accepts_cod));
  }, [retailerProfile?.accepts_cod]);

  const handleToggle = async (maybeChecked) => {
    // determine nextChecked robustly:
    // - if Switch passed a boolean, use it
    // - otherwise invert current local state (click from keyboard/case)
    const nextChecked = typeof maybeChecked === "boolean" ? maybeChecked : !checked;

    // optimistic UI
    setChecked(nextChecked);
    setToggling(true);

    try {
      // send the explicit nextChecked value to server
      console.log("Updating COD status to:", nextChecked);
      await OrderApi.acceptCOD(retailerId, { accepts_cod: nextChecked });

      // inform parent to refresh if needed
      // if (typeof onUpdate === "function") onUpdate();
    } catch (err) {
      console.error("Failed to update COD status:", err);
      // revert optimistic change
      setChecked((prev) => !prev);
      // optional: show a toast/alert here
    } finally {
      setToggling(false);
    }
  };

  return (
    <Card className="bg-white border-2 border-[#F4B321]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4B321] bg-opacity-20 rounded-full flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-[#F4B321]" />
            </div>
            <div>
              <Label htmlFor="cod-toggle" className="text-base font-bold text-gray-900 cursor-pointer">
                Accept Cash on Delivery (COD)
              </Label>
              <p className="text-xs text-gray-600 mt-1">Enable to receive cash payment orders</p>
            </div>
          </div>

          <Switch
            id="cod-toggle"
            checked={checked}
            onCheckedChange={handleToggle}
            disabled={toggling}
            className="data-[state=checked]:bg-[#F4B321]"
          />
        </div>

        {checked && (
          <Alert className="mt-3 bg-[#F4B321] bg-opacity-10 border-[#F4B321]">
            <Info className="w-4 h-4 text-[#F4B321]" />
            <AlertDescription className="text-sm text-gray-900 font-medium">
              ✅ You will receive COD orders. Collect exact cash amount from customers.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
