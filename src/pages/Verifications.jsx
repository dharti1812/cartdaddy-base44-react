import React, { useState, useEffect } from "react";
import { User } from "@/api/entities"; // User entity remains from its original source
import { Retailer, DeliveryPartner } from "@/components/utils/mockApi"; // Corrected path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  Store,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import RetailerVerificationCard from "../components/verifications/RetailerVerificationCard";
import DeliveryBoyVerificationCard from "../components/verifications/DeliveryBoyVerificationCard";
import VerificationDetailsDialog from "../components/verifications/VerificationDetailsDialog";
import axios from "axios";
import { API_BASE_URL } from "@/config";

export default function VerificationsPage() {
  const [retailers, setRetailers] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("retailers");
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // User.me() is assumed to still be available from "@/api/entities"
      // const admin = await User.me();
      // setCurrentAdmin(admin);

      const token = sessionStorage.getItem("token");

      const [retailersRes, deliveryBoysRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sellers/pending-sellers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/delivery_boys/pending-delivery_boys`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      const retailersData = await retailersRes.json();
      const deliveryBoysData = await deliveryBoysRes.json();

      setRetailers(retailersData.data || []);
      setDeliveryBoys(deliveryBoysData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const pendingRetailers = retailers;

  const pendingDeliveryBoys = deliveryBoys;

  const filteredRetailers = retailers.filter(
    (r) =>
      !searchTerm ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gst_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeliveryBoys = pendingDeliveryBoys.filter(
    (db) =>
      !searchTerm ||
      db.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.phone?.includes(searchTerm) ||
      db.driving_license?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Verifications</h1>
            <p className="text-white opacity-90 mt-1">
              Review and approve new registrations
            </p>
          </div>
          <div className="flex gap-3">
            <Badge className="bg-amber-500 text-white text-lg px-4 py-2">
              {pendingRetailers.length} Retailers Pending
            </Badge>
            <Badge className="bg-green-500 text-white text-lg px-4 py-2">
              {pendingDeliveryBoys.length} Delivery Partners Pending
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, GST, phone, DL number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-none shadow-md">
            <CardHeader className="border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="retailers" className="relative">
                  <Store className="w-4 h-4 mr-2" />
                  Retailers
                  {pendingRetailers.length > 0 && (
                    <Badge className="ml-2 bg-amber-500 text-white">
                      {pendingRetailers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="delivery_boys" className="relative">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Delivery Partners
                  {pendingDeliveryBoys.length > 0 && (
                    <Badge className="ml-2 bg-green-500 text-white">
                      {pendingDeliveryBoys.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4">
              <TabsContent value="retailers" className="mt-0">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B321] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : filteredRetailers.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Pending Retailers
                    </h3>
                    <p className="text-gray-500">
                      All retailer applications have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredRetailers.map((retailer) => (
                      <RetailerVerificationCard
                        key={retailer.id}
                        retailer={retailer}
                        onClick={() =>
                          setSelectedItem({ type: "retailer", data: retailer })
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="delivery_boys" className="mt-0">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B321] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : filteredDeliveryBoys.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Pending Delivery Partners
                    </h3>
                    <p className="text-gray-500">
                      All delivery partner applications have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredDeliveryBoys.map((db) => (
                      <DeliveryBoyVerificationCard
                        key={db.id}
                        deliveryBoy={db}
                        onClick={() =>
                          setSelectedItem({ type: "delivery_boy", data: db })
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* Verification Details Dialog */}
        {selectedItem && (
          <VerificationDetailsDialog
            item={selectedItem}
            currentAdmin={currentAdmin}
            onClose={() => setSelectedItem(null)}
            onSuccess={() => {
              loadData();
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
