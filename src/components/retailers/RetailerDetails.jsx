import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  User,
  Phone,
  Mail,
  Bike,
  Star,
  Package,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Retailer } from "@/api/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { retailerApi } from "../utils/retailerApi";

export default function RetailerDetails({ retailer, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await retailerApi.update(retailer.id, { status: newStatus });
    setUpdating(false);
    onUpdate();
  };

  const handleAvailabilityChange = async (newAvailability) => {
    setUpdating(true);
    await retailerApi.update(retailer.id, {
      availability_status: newAvailability,
    });
    setUpdating(false);
    onUpdate();
  };

  return (
    <Card className="border-none shadow-lg sticky top-4">
      <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">
          Retailer Details
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="text-center pb-6 border-b">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            {retailer.name?.[0]?.toUpperCase() || "R"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {retailer.name}
          </h3>
          <div className="flex items-center justify-center gap-2">
            {retailer.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900">
                  {retailer.rating.toFixed(1)}
                </span>
              </div>
            )}
            <Badge
              className={`${
                retailer.availability_status === "online"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              } border`}
            >
              {retailer.availability_status}
            </Badge>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{retailer.phone}</p>
              </div>
            </div>
            {retailer.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{retailer.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Vehicle Details</h3>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Bike className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900 capitalize">
                {retailer.vehicle_type}
              </span>
            </div>
            {retailer.vehicle_number && (
              <p className="text-sm text-gray-700 font-mono">
                {retailer.vehicle_number}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {retailer.total_deliveries || 0}
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Success</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {retailer.successful_deliveries || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-gray-600">Accept Rate</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">
                {retailer.acceptance_rate || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">On Time</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {retailer.on_time_rate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Earnings</h3>
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{retailer.total_earnings || 0}
              </p>
            </div>
            {retailer.pending_payout > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pending Payout</p>
                    <p className="text-xl font-bold text-amber-700">
                      ₹{retailer.pending_payout}
                    </p>
                  </div>
                  <Button size="sm" className="bg-blue-900 hover:bg-blue-800">
                    Process
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {retailer.skills && retailer.skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Skills & Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {retailer.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Award className="w-3 h-3 mr-1" />
                  {skill.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Status Management
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Priority Tier
              </label>
              <Select
                value={retailer.priority_tier || "tier_b"}
                onValueChange={async (value) => {
                  setUpdating(true);
                  await Retailer.update(retailer.id, { priority_tier: value });
                  setUpdating(false);
                  onUpdate();
                }}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier_a">⭐ Tier A (Premium)</SelectItem>
                  <SelectItem value="tier_b">🔵 Tier B (Standard)</SelectItem>
                  <SelectItem value="tier_c">🟡 Tier C (Basic)</SelectItem>
                  <SelectItem value="tier_d">⚪ Tier D (New)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Controls order priority - Tier A gets orders first
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Account Status
              </label>
              <Select
                value={retailer.status}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending_verification">
                    Pending Verification
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Availability
              </label>
              <Select
                value={retailer.availability_status}
                onValueChange={handleAvailabilityChange}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
