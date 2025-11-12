import React, { useState, useEffect } from "react";
import { retailerApi } from "@/components/utils/retailerApi";
import {deliveryPartnerApi} from "@/components/utils/deliveryPartnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Bike, Car, CheckCircle, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * ManageDeliveryBoys Component
 * Allows retailer to select which delivery boys they want to work with
 * Supports individual selection and "Select All"
 */

export default function ManageDeliveryBoys({ retailerId }) {
  const [retailer, setRetailer] = useState(null);
  const [allDeliveryBoys, setAllDeliveryBoys] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState("all"); // 'all', '2_wheeler', '4_wheeler'

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  setLoading(true);
  try {

    
    const retailerData = await retailerApi.list();
    const deliveryBoys = await deliveryPartnerApi.list();

    console.log("➡️ Retailer:", retailerData);
    console.log("➡️ Delivery Boys Loaded:", deliveryBoys.length, deliveryBoys);

    setRetailer(retailerData);
    setAllDeliveryBoys(deliveryBoys);

    // Load selected delivery partners from retailer record
    const selected = retailerData?.selected_delivery_partners || [];
    setSelectedIds(selected);

  } catch (error) {
    console.error("Error loading data:", error);
  }
  setLoading(false);
};


  const handleToggle = (deliveryBoyId) => {
    setSelectedIds(prev => 
      prev.includes(deliveryBoyId)
        ? prev.filter(id => id !== deliveryBoyId)
        : [...prev, deliveryBoyId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredDeliveryBoys();
    const allFilteredIds = filtered.map(db => db.id);
    
    // If all filtered are already selected, deselect them
    const allSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await retailerApi.selectDeliveryPartners({
        selected_delivery_partners: selectedIds
      });
      
      alert("✅ Delivery partner preferences saved successfully!");
      loadData();
    } catch (error) {
      console.error("Error saving:", error);
      alert("❌ Failed to save preferences");
    }
    setSaving(false);
  };

  const getFilteredDeliveryBoys = () => {
    return allDeliveryBoys.filter(db => {
      const matchesSearch = !searchTerm || 
        db.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        db.phone?.includes(searchTerm);
      
      const matchesVehicle = filterVehicle === 'all' || db.vehicle_type === filterVehicle;
      
      return matchesSearch && matchesVehicle;
    });
  };

  const filteredDeliveryBoys = getFilteredDeliveryBoys();
  const twoWheelerCount = allDeliveryBoys.filter(db => db.vehicle_type === '2_wheeler').length;
  const fourWheelerCount = allDeliveryBoys.filter(db => db.vehicle_type === '4_wheeler').length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading delivery partners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Delivery Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Select delivery partners you want to work with.</strong><br/>
              • Only selected partners will receive your order notifications<br/>
              • Partners must also select you in their app for mutual linking<br/>
              • You have selected <strong>{selectedIds.length}</strong> out of {allDeliveryBoys.length} active partners
            </AlertDescription>
          </Alert>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{allDeliveryBoys.length}</p>
              <p className="text-xs text-gray-600">Total Active</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-900">{twoWheelerCount}</p>
              <p className="text-xs text-blue-600">🏍️ 2-Wheeler</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">{fourWheelerCount}</p>
              <p className="text-xs text-green-600">🚗 4-Wheeler</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterVehicle === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterVehicle('all')}
              >
                All
              </Button>
              <Button
                variant={filterVehicle === '2_wheeler' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterVehicle('2_wheeler')}
                className="gap-1"
              >
                <Bike className="w-4 h-4" />
                2W
              </Button>
              <Button
                variant={filterVehicle === '4_wheeler' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterVehicle('4_wheeler')}
                className="gap-1"
              >
                <Car className="w-4 h-4" />
                4W
              </Button>
            </div>
          </div>

          {/* Select All Button */}
          <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">
              {filteredDeliveryBoys.length} partners shown
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {filteredDeliveryBoys.every(db => selectedIds.includes(db.id)) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Delivery Boys List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDeliveryBoys.map((db) => {
              const isSelected = selectedIds.includes(db.id);
              const hasSelectedRetailer = db.selected_retailers?.includes(retailerId);
              const isMutuallyLinked = isSelected && hasSelectedRetailer;

              return (
                <div
                  key={db.id}
                  onClick={() => handleToggle(db.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(db.id)}
                    className="flex-shrink-0"
                  />

                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {db.name?.[0]?.toUpperCase() || 'D'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{db.name}</p>
                      {isMutuallyLinked && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mutual
                        </Badge>
                      )}
                      {isSelected && !hasSelectedRetailer && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{db.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {db.vehicle_type === '2_wheeler' ? (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <Bike className="w-3 h-3 mr-1" />
                          2-Wheeler
                        </Badge>
                      ) : db.vehicle_type === '4_wheeler' ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          <Car className="w-3 h-3 mr-1" />
                          4-Wheeler
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                         No vehicle information
                        </Badge>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {filteredDeliveryBoys.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No delivery partners found</p>
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : `Save Selection (${selectedIds.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}