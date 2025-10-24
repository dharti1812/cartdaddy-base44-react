import React, { useState, useEffect } from "react";
import { Retailer, DeliveryPartner } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Store, CheckCircle, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { retailerApi } from "@/components/utils/retailerApi";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";
import { API_BASE_URL } from "../../config";
/**
 * SelectRetailers Component
 * Allows delivery boy to select which retailers they want to work with
 * Supports individual selection and "Select All"
 */

export default function SelectRetailers({ deliveryPartnerId }) {
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [allRetailers, setAllRetailers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dpData, retailersResponse] = await Promise.all([
        await deliveryPartnerApi.getByUserId(deliveryPartnerId),
        retailerApi.list(),
      ]);
      const retailers = Array.isArray(retailersResponse)
        ? retailersResponse
        : retailersResponse.data || [];

      console.log("Fetched retailers:", retailers);
      setDeliveryPartner(dpData);

      setAllRetailers(retailers);
      console.log("Fetched retailers:", retailers);
      // Load already selected retailers
      const selected = dpData?.selected_sellers || [];
      console.log(selected);
      setSelectedIds(selected);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleToggle = (retailerId) => {
    setSelectedIds((prev) =>
      prev.includes(retailerId)
        ? prev.filter((id) => id !== retailerId)
        : [...prev, retailerId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredRetailers();
    const allFilteredIds = filtered.map((r) => r.id);

    // If all filtered are already selected, deselect them
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("token");
      await fetch(
        `${API_BASE_URL}/api/delivery_boy/${deliveryPartnerId}/sellers`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ selected_sellers: selectedIds }),
        }
      );

      alert("✅ Retailer preferences saved successfully!");
      loadData();
    } catch (error) {
      console.error("Error saving:", error);
      alert("❌ Failed to save preferences");
    }
    setSaving(false);
  };

  const getFilteredRetailers = () => {
    return allRetailers.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone?.includes(searchTerm);

      return matchesSearch;
    });
  };

  const filteredRetailers = getFilteredRetailers();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading retailers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Select Retailers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="bg-green-50 border-green-200 mb-4">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-900 text-sm">
              <strong>Select retailers you want to work with.</strong>
              <br />
              • Only receive orders from selected retailers
              <br />
              • Retailers must also select you for mutual linking
              <br />• You have selected <strong>
                {selectedIds.length}
              </strong>{" "}
              out of {allRetailers.length} active retailers
            </AlertDescription>
          </Alert>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {allRetailers.length}
              </p>
              <p className="text-xs text-gray-600">Total Active Retailers</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">
                {selectedIds.length}
              </p>
              <p className="text-xs text-green-600">Your Selected</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, shop name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All Button */}
          <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">
              {filteredRetailers.length} retailers shown
            </span>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {filteredRetailers.every((r) => selectedIds.includes(r.id))
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          {/* Retailers List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRetailers.map((retailer) => {
              const isSelected = selectedIds.includes(retailer.id);
              const hasSelectedDP =
                retailer.selected_delivery_partners?.includes(
                  deliveryPartnerId
                );
              const isMutuallyLinked = isSelected && hasSelectedDP;

              return (
                <div
                  key={retailer.id}
                  onClick={() => handleToggle(retailer.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(retailer.id)}
                    className="flex-shrink-0"
                  />

                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {retailer.name?.[0]?.toUpperCase() || "R"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {retailer.name}
                        </p>
                        {retailer.business_name && (
                          <p className="text-sm text-gray-600">
                            {retailer.business_name}
                          </p>
                        )}
                      </div>
                      {isMutuallyLinked && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mutual
                        </Badge>
                      )}
                      {isSelected && !hasSelectedDP && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{retailer.phone}</p>
                    {retailer.rating && (
                      <Badge variant="outline" className="text-xs mt-1">
                        ⭐ {retailer.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRetailers.length === 0 && (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No retailers found</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={loadData}>
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Saving..." : `Save Selection (${selectedIds.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
