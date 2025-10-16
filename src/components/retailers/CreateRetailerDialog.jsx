
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import { Retailer } from "@/api/entities";

export default function CreateRetailerDialog({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    // Removed direct vehicle_type and vehicle_number, now part of vehicles array
    vehicles: [{
      type: "bike",
      number: "",
      can_carry_heavy_items: false, // New field for vehicle
    }],
    driving_license_verified: false, // New field for DL verification
    product_weight_classification: "light", // New field for product weight classification
    priority_tier: "tier_b",
    status: "active",
    availability_status: "offline",
    capacity_per_day: 20,
    rating: 4.0
  });

  const handleVehicleChange = (index, field, value) => {
    const updatedVehicles = formData.vehicles.map((vehicle, i) =>
      i === index ? { ...vehicle, [field]: value } : vehicle
    );
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const handleAddVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [...formData.vehicles, { type: "bike", number: "", can_carry_heavy_items: false }]
    });
  };

  const handleRemoveVehicle = (index) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const token = localStorage.getItem("adminToken"); // if you use authentication

    const response = await fetch("http://localhost:8000/api/retailers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // optional
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to add retailer");
    }

    const result = await response.json();
    console.log("Retailer created:", result);

    onSuccess(); // refresh the list in parent
    onClose();   // close the modal
  } catch (error) {
    console.error(error);
    alert("Error creating retailer: " + error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Retailer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91XXXXXXXXXX"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="retailer@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="border p-4 rounded-md space-y-3 relative">
                {formData.vehicles.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveVehicle(index)}
                  >
                    Remove
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`vehicle_type_${index}`}>Vehicle Type</Label>
                    <Select
                      value={vehicle.type}
                      onValueChange={(value) => handleVehicleChange(index, 'type', value)}
                    >
                      <SelectTrigger id={`vehicle_type_${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="scooter">Scooter</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`vehicle_number_${index}`}>Vehicle Number</Label>
                    <Input
                      id={`vehicle_number_${index}`}
                      value={vehicle.number}
                      onChange={(e) => handleVehicleChange(index, 'number', e.target.value)}
                      placeholder="MH-01-AB-1234"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`can_carry_heavy_items_${index}`}
                    checked={vehicle.can_carry_heavy_items}
                    onCheckedChange={(checked) => handleVehicleChange(index, 'can_carry_heavy_items', checked)}
                  />
                  <Label htmlFor={`can_carry_heavy_items_${index}`}>Can carry heavy/large items?</Label>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddVehicle} className="w-full">
              + Add Another Vehicle
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Verification & Capabilities</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="driving_license_verified"
                  checked={formData.driving_license_verified}
                  onCheckedChange={(checked) => setFormData({...formData, driving_license_verified: checked})}
                />
                <Label htmlFor="driving_license_verified">Driving License Verified</Label>
              </div>
              <div>
                <Label htmlFor="product_weight_classification">Product Weight Classification</Label>
                <Select
                  value={formData.product_weight_classification}
                  onValueChange={(value) => setFormData({...formData, product_weight_classification: value})}
                >
                  <SelectTrigger id="product_weight_classification">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light (e.g., documents, small parcels)</SelectItem>
                    <SelectItem value="medium">Medium (e.g., groceries, electronics)</SelectItem>
                    <SelectItem value="heavy">Heavy (e.g., furniture, appliances)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority_tier">Priority Tier *</Label>
                <Select
                  value={formData.priority_tier}
                  onValueChange={(value) => setFormData({...formData, priority_tier: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier_a">⭐ Tier A (Premium - Top Priority)</SelectItem>
                    <SelectItem value="tier_b">🔵 Tier B (Standard - Good)</SelectItem>
                    <SelectItem value="tier_c">🟡 Tier C (Basic - Average)</SelectItem>
                    <SelectItem value="tier_d">⚪ Tier D (New - Low Priority)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.priority_tier === 'tier_a' && 'Gets orders first - highest priority'}
                  {formData.priority_tier === 'tier_b' && 'Standard priority - reliable sellers'}
                  {formData.priority_tier === 'tier_c' && 'Basic priority - average performance'}
                  {formData.priority_tier === 'tier_d' && 'Lowest priority - new or underperforming'}
                </p>
              </div>
              <div>
                <Label htmlFor="capacity">Daily Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity_per_day}
                  onChange={(e) => setFormData({...formData, capacity_per_day: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800">
              {loading ? "Creating..." : "Add Retailer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
