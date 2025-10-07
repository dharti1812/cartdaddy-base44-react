
import React, { useState, useEffect } from "react";
import { DispatchConfig } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save, AlertCircle, Users, DollarSign, Timer, Navigation as NavigationIcon, CheckCircle, IndianRupee, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const configs = await DispatchConfig.list();
    if (configs.length > 0) {
      setConfig(configs[0]);
    } else {
      // Create default config
      setConfig({
        config_name: "Cart Daddy Dispatch Configuration",
        is_active: true,
        geofence_radius_m: 5000,
        max_retailer_acceptances: 3,
        cancellation_penalty_percentage: 2.0,
        paylink_timeout_sec: 150,
        max_concurrent_orders: 3, // Added this new field with a default value
        priority_tiers: [
          {
            tier_name: "tier_1_premium",
            display_name: "Premium Partners",
            order_priority: 1,
            criteria: "Rating >= 4.7, Success Rate >= 95%, Experience >= 6 months"
          },
          {
            tier_name: "tier_2_preferred",
            display_name: "Preferred Partners",
            order_priority: 2,
            criteria: "Rating >= 4.5, Success Rate >= 90%, Experience >= 3 months"
          },
          {
            tier_name: "tier_3_standard",
            display_name: "Standard Partners",
            order_priority: 3,
            criteria: "Rating >= 4.0, Success Rate >= 85%"
          },
          {
            tier_name: "tier_4_backup",
            display_name: "Backup Partners",
            order_priority: 4,
            criteria: "All active retailers"
          }
        ],
        sla_rules: {
          standard_minutes: 60,
          express_minutes: 30
        },
        payment_channels: ["sms", "whatsapp", "app", "email"],
        escalation_rules: {
          auto_escalate_on_failure: true,
          escalation_delay_minutes: 5
        },
        // New fields for Delivery Charge Auto-Calculation
        fuel_cost_per_km: 5,
        delivery_charge_threshold: 20000,
        base_delivery_charge_low: 75,
        base_delivery_charge_high: 125,
        // Removed retailer_commission_percentage and delivery_boy_commission_percentage as they are no longer used in settlement-based model.
        // New fields for Intelligent Order Queuing System
        order_queue_enabled: true,
        min_online_retailers_percentage: 50,
        queue_retry_interval_minutes: 15,
        business_hours_start: "08:00",
        business_hours_end: "22:00"
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (config.id) {
      await DispatchConfig.update(config.id, config);
    } else {
      await DispatchConfig.create(config);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    loadConfig();
  };

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  const exampleOrderValue = 15000;
  const exampleDistance = 5;
  const fuelCostPerKm = config?.fuel_cost_per_km || 5;
  const deliveryChargeThreshold = config?.delivery_charge_threshold || 20000;
  const baseDeliveryChargeLow = config?.base_delivery_charge_low || 75;
  const baseDeliveryChargeHigh = config?.base_delivery_charge_high || 125;

  const calculatedExampleFuelComponent = exampleDistance * fuelCostPerKm;
  // For the example, we assume order value (15000) is below the default threshold (20000),
  // so baseDeliveryChargeLow is used. If the threshold changed, this would dynamically reflect.
  const calculatedExampleBaseCharge = exampleOrderValue < deliveryChargeThreshold ? baseDeliveryChargeLow : baseDeliveryChargeHigh;
  const totalExampleDeliveryCharge = calculatedExampleFuelComponent + calculatedExampleBaseCharge;

  const customerTotalPayment = exampleOrderValue + totalExampleDeliveryCharge;
  const sellerNetSettlement = exampleOrderValue - totalExampleDeliveryCharge;
  const deliveryBoyPayout = totalExampleDeliveryCharge;


  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">System Configuration</h1>
            <p className="text-white text-opacity-80 mt-1">Configure delivery charges, queuing & dispatch rules</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-[#F4B321] hover:bg-[#e0a020] text-gray-900 font-semibold">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {saved && (
          <Alert className="mb-6 bg-green-50 border-green-500 border-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-900 font-semibold">
              Settings saved successfully! Changes are now live.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Delivery Charge Calculation */}
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <IndianRupee className="w-5 h-5 text-green-600" />
                Delivery Charge Auto-Calculation (Settlement-Based)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Alert className="bg-blue-50 border-blue-500 border-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm font-medium">
                  <strong>Payment Flow:</strong> Customer → Platform → Seller Settlement (Order Value - Delivery Charges) → Delivery Boy Payout<br/>
                  <strong>Formula:</strong> Delivery Charge = (Distance × Fuel Cost/KM) + Base Charge<br/>
                  <strong>Settlement:</strong> Seller receives Order Value MINUS Delivery Charges. Deducted amount goes to Delivery Boy.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 font-medium">Fuel Cost per KM (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={config?.fuel_cost_per_km || 5}
                    onChange={(e) => setConfig({...config, fuel_cost_per_km: parseFloat(e.target.value) || 0})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: ₹{config?.fuel_cost_per_km || 5} per kilometer</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Order Value Threshold (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config?.delivery_charge_threshold || 20000}
                    onChange={(e) => setConfig({...config, delivery_charge_threshold: parseInt(e.target.value) || 0})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Switch base charge at this amount</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Base Charge - Below Threshold (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config?.base_delivery_charge_low || 75}
                    onChange={(e) => setConfig({...config, base_delivery_charge_low: parseInt(e.target.value) || 0})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">For orders below ₹{config?.delivery_charge_threshold || 20000}</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Base Charge - Above Threshold (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config?.base_delivery_charge_high || 125}
                    onChange={(e) => setConfig({...config, base_delivery_charge_high: parseInt(e.target.value) || 0})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">For orders above ₹{config?.delivery_charge_threshold || 20000}</p>
                </div>
              </div>

              {/* Commission split section removed */}

              {/* Updated Example Calculation */}
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg">
                <p className="text-sm font-bold text-gray-900 mb-3">📊 Example Calculation:</p>
                <div className="text-sm text-gray-700 space-y-1.5">
                  <p>• Customer pays: <strong>₹{customerTotalPayment.toFixed(0)}</strong> (₹{exampleOrderValue} order + ₹{totalExampleDeliveryCharge.toFixed(0)} delivery)</p>
                  <p>• Order Value: ₹{exampleOrderValue} (below ₹{deliveryChargeThreshold.toFixed(0)} threshold)</p>
                  <p>• Distance: {exampleDistance} km</p>
                  <p>• Fuel Cost: {exampleDistance} km × ₹{fuelCostPerKm.toFixed(0)} = <strong>₹{calculatedExampleFuelComponent.toFixed(0)}</strong></p>
                  <p>• Base Charge: <strong>₹{calculatedExampleBaseCharge.toFixed(0)}</strong></p>
                  <p className="font-bold pt-2 border-t text-base text-gray-900">
                    → Total Delivery Charge: ₹{totalExampleDeliveryCharge.toFixed(0)}
                  </p>
                  <div className="pt-2 border-t space-y-1 bg-amber-50 p-3 rounded mt-2">
                    <p className="text-green-700 font-bold">
                      ✅ Seller Net Settlement: ₹{sellerNetSettlement.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-600">(₹{exampleOrderValue} order value - ₹{totalExampleDeliveryCharge.toFixed(0)} delivery charges)</p>
                    <p className="text-blue-700 font-bold mt-2">
                      💰 Delivery Boy Payout: ₹{deliveryBoyPayout.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-600">(Deducted from seller settlement)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Queuing System */}
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-amber-600" />
                Intelligent Order Queuing System
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
                <div>
                  <Label className="text-base font-semibold text-amber-900">Enable Order Queuing</Label>
                  <p className="text-sm text-amber-700 mt-1">Auto-queue orders when retailers unavailable or outside business hours</p>
                </div>
                <Switch
                  checked={config?.order_queue_enabled !== false} // Default to true if undefined
                  onCheckedChange={(checked) => setConfig({...config, order_queue_enabled: checked})}
                  className="data-[state=checked]:bg-[#F4B321]"
                />
              </div>

              <Alert className="bg-blue-50 border-blue-500 border-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Smart Queuing:</strong> Orders are automatically queued during nights or when fewer than {config?.min_online_retailers_percentage || 50}% retailers are online. System sends to retailers when shops open in morning or when more become available. Customers are notified automatically.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 font-medium">Minimum Online Retailers (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={config?.min_online_retailers_percentage || 50}
                    onChange={(e) => setConfig({...config, min_online_retailers_percentage: parseInt(e.target.value) || 0})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Queue if less than this percentage are online</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Auto-Retry Interval (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={config?.queue_retry_interval_minutes || 15}
                    onChange={(e) => setConfig({...config, queue_retry_interval_minutes: parseInt(e.target.value) || 15})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">How often to retry sending queued orders</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Business Hours Start</Label>
                  <Input
                    type="time"
                    value={config?.business_hours_start || "08:00"}
                    onChange={(e) => setConfig({...config, business_hours_start: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">When to start sending queued morning orders</p>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Business Hours End</Label>
                  <Input
                    type="time"
                    value={config?.business_hours_end || "22:00"}
                    onChange={(e) => setConfig({...config, business_hours_end: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Last order acceptance time (queue after this)</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 border-2 border-green-400 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">✅ What Happens Automatically:</p>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Orders placed at night are queued until {config?.business_hours_start || "08:00"}</li>
                  <li>Customers get SMS/WhatsApp: "Your order is queued and will be processed soon"</li>
                  <li>System keeps prompting retailers every {config?.queue_retry_interval_minutes || 15} minutes</li>
                  <li>Orders auto-release when {config?.min_online_retailers_percentage || 50}%+ retailers come online</li>
                  <li>Orders auto-release when business hours start in morning</li>
                </ul>
              </div>
            </CardContent>
          </Card>


          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <NavigationIcon className="w-5 h-5 text-blue-600" />
                Geofence & Broadcasting
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Geofence Radius (meters)</Label>
                <p className="text-sm text-gray-500 mb-2">Initial radius within which orders are broadcast to sellers</p>
                <Input
                  type="number"
                  value={config?.geofence_radius_m}
                  onChange={(e) => setConfig({...config, geofence_radius_m: parseInt(e.target.value)})}
                  placeholder="5000"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {((config?.geofence_radius_m || 0) / 1000).toFixed(1)} km</p>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Auto-Expansion:</strong> If no sellers found within {((config?.geofence_radius_m || 0) / 1000).toFixed(1)} km, radius automatically expands by 2 km increments up to 20 km maximum.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Multi-Retailer Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Maximum Retailers Per Order</Label>
                <p className="text-sm text-gray-500 mb-2">Number of retailers who can accept same order (with priority positions)</p>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={config?.max_retailer_acceptances}
                  onChange={(e) => setConfig({...config, max_retailer_acceptances: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">Position 1 = Primary, Position 2+ = Backups</p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>How it works:</strong> Order is broadcast to all retailers in geofence. Up to {config?.max_retailer_acceptances} can accept. 
                  1st acceptance = Primary delivery. 2nd & 3rd = Backups in case primary fails.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Cancellation Penalty
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Penalty Percentage</Label>
                <p className="text-sm text-gray-500 mb-2">Percentage of order value charged if retailer cancels after acceptance</p>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={config?.cancellation_penalty_percentage}
                  onChange={(e) => setConfig({...config, cancellation_penalty_percentage: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">Example: {config?.cancellation_penalty_percentage}% of ₹10,000 order = ₹{(10000 * (config?.cancellation_penalty_percentage || 0) / 100).toFixed(0)} penalty</p>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-900">
                  Penalty is auto-calculated and tracked in admin dashboard. Deducted from retailer's next payout.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-green-600" />
                Payment Link Timeout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Payment Link Generation Timeout (seconds)</Label>
                <p className="text-sm text-gray-500 mb-2">Time given to retailer to generate & submit payment link</p>
                <Input
                  type="number"
                  min="60"
                  max="300"
                  value={config?.paylink_timeout_sec}
                  onChange={(e) => setConfig({...config, paylink_timeout_sec: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">Current: {Math.floor((config?.paylink_timeout_sec || 0) / 60)}:{( (config?.paylink_timeout_sec || 0) % 60).toString().padStart(2, '0')} minutes</p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-sm text-green-900">
                  If retailer doesn't submit link in time, order is automatically reassigned to next retailer in queue.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle>Priority Tiers (Order Broadcasting Sequence)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900 text-sm">
                  <strong>How it works:</strong> Orders are first sent to Tier 1 (Premium) sellers within geofence. If none accept within 30 seconds, broadcast to Tier 2, then Tier 3, then Tier 4. Within each tier, nearest sellers see the order first.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                {config?.priority_tiers?.map((tier, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{tier.display_name.replace('Partners', 'Sellers')}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white">Priority {tier.order_priority}</Badge>
                        <Badge variant="outline" className="text-xs">{
                          tier.order_priority === 1 ? 'First 0-30s' :
                          tier.order_priority === 2 ? '30-60s' :
                          tier.order_priority === 3 ? '60-90s' :
                          '90s+'
                        }</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{tier.criteria}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New Section: Retailer Capacity Settings */}
          <div>
            <h3 className="font-semibold text-white mb-3">Retailer Capacity Settings</h3>
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Concurrent Orders:</strong> Maximum number of orders a seller can handle at the same time (default: 3). When they reach this limit, they won't see new orders until they complete some.
                </AlertDescription>
              </Alert>
              
              <Card className="border-none shadow-md">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Retailer Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Default Max Concurrent Orders Per Seller</Label>
                    <p className="text-sm text-gray-500 mb-2">How many orders can one seller handle simultaneously</p>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={config?.max_concurrent_orders || 3} // Fallback to 3 if undefined
                      onChange={(e) => setConfig({...config, max_concurrent_orders: parseInt(e.target.value)})}
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 3-5 orders for optimal service quality</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* End New Section */}

          <Card className="border-none shadow-md bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">Dynamic Configuration</p>
                  <p className="text-sm text-blue-700">
                    All settings on this page are dynamic and take effect immediately. Retailers will see updated values (penalty amounts, timeouts, etc.) on their next order acceptance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
