
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IndianRupee, Info } from "lucide-react";
import { Retailer } from "@/api/entities";

export default function CODToggle({ retailerId, retailerProfile, onUpdate }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (checked) => {
    setToggling(true);
    await Retailer.update(retailerId, {
      accepts_cod: checked
    });
    setToggling(false);
    onUpdate();
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
            checked={retailerProfile?.accepts_cod || false}
            onCheckedChange={handleToggle}
            disabled={toggling}
            className="data-[state=checked]:bg-[#F4B321]"
          />
        </div>
        
        {retailerProfile?.accepts_cod && (
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
