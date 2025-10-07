import React, { useState, useEffect } from 'react';
import { DeliveryPartner, Retailer, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, UserPlus, Search, CheckCircle, XCircle, 
  Clock, Phone, Mail, AlertCircle, TrendingUp, Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ManageDeliveryPartners() {
  const [retailerProfile, setRetailerProfile] = useState(null);
  const [allPartners, setAllPartners] = useState([]);
  const [myPartners, setMyPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("my-partners");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const retailers = await Retailer.filter({ email: user.email });
      
      if (retailers.length > 0) {
        const retailer = retailers[0];
        setRetailerProfile(retailer);

        // Get all approved delivery partners
        const partners = await DeliveryPartner.filter({ 
          onboarding_status: 'approved',
          status: 'active'
        });
        setAllPartners(partners);

        // Filter partners already working with this retailer
        const working = partners.filter(dp => 
          dp.partnered_retailers?.some(pr => 
            pr.retailer_id === retailer.id && pr.partnership_status === 'approved'
          )
        );
        setMyPartners(working);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading partners:", error);
      setLoading(false);
    }
  };

  const handleInvitePartner = async (partner) => {
    setSelectedPartner(partner);
    setShowInviteDialog(true);
  };

  const confirmInvite = async () => {
    if (!selectedPartner) return;
    
    setInviting(true);

    // Add partnership request to delivery partner
    const partnerships = selectedPartner.partnered_retailers || [];
    
    // Check if already exists
    const existingIndex = partnerships.findIndex(pr => pr.retailer_id === retailerProfile.id);
    
    if (existingIndex >= 0) {
      partnerships[existingIndex] = {
        ...partnerships[existingIndex],
        partnership_status: 'approved',
        approved_at: new Date().toISOString()
      };
    } else {
      partnerships.push({
        retailer_id: retailerProfile.id,
        retailer_name: retailerProfile.full_name,
        partnership_status: 'approved',
        requested_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        commission_percentage: 10
      });
    }

    await DeliveryPartner.update(selectedPartner.id, {
      partnered_retailers: partnerships
    });

    // Send notification to delivery partner
    try {
      await fetch("https://api.sarv.com/api/v2.0/sms_campaign.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: window.REACT_APP_SARV_API_TOKEN || "YOUR_TOKEN",
          sender: "CARTDD",
          route: "TR",
          mobile: selectedPartner.phone.replace("+91", ""),
          message: `🎉 Great News! ${retailerProfile.full_name} has added you as their delivery partner. Login to Cart Daddy app to start receiving orders! - Cart Daddy`
        })
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
    }

    setInviting(false);
    setShowInviteDialog(false);
    setSelectedPartner(null);
    loadData();
  };

  const handleRemovePartner = async (partnerId) => {
    if (!window.confirm("Are you sure you want to remove this delivery partner?")) return;

    const partner = myPartners.find(p => p.id === partnerId);
    const partnerships = partner.partnered_retailers.filter(pr => pr.retailer_id !== retailerProfile.id);

    await DeliveryPartner.update(partnerId, {
      partnered_retailers: partnerships
    });

    loadData();
  };

  const availablePartners = allPartners.filter(partner => 
    !myPartners.some(mp => mp.id === partner.id) &&
    (searchTerm === "" || 
     partner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     partner.phone.includes(searchTerm))
  );

  const filteredMyPartners = myPartners.filter(partner =>
    searchTerm === "" || 
    partner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading delivery partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Delivery Partners</h1>
            <p className="text-gray-500 mt-1">Build your delivery team</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">My Partners</p>
                  <p className="text-3xl font-bold text-gray-900">{myPartners.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Available Partners</p>
                  <p className="text-3xl font-bold text-gray-900">{availablePartners.length}</p>
                </div>
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Online Now</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {myPartners.filter(p => ['online', 'on_delivery'].includes(p.availability_status)).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {myPartners.length > 0
                      ? (myPartners.reduce((sum, p) => sum + (p.rating || 0), 0) / myPartners.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <Star className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border">
            <TabsTrigger value="my-partners">
              My Partners ({myPartners.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available Partners ({availablePartners.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-partners">
            {filteredMyPartners.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Partners Yet</h3>
                  <p className="text-gray-500 mb-4">Start building your delivery team</p>
                  <Button onClick={() => setActiveTab('available')} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find Partners
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMyPartners.map((partner) => (
                  <Card key={partner.id} className="border-2 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {partner.full_name[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{partner.full_name}</h3>
                            <p className="text-xs text-gray-600">{partner.vehicle_type}</p>
                          </div>
                        </div>
                        <Badge className={
                          ['online', 'on_delivery'].includes(partner.availability_status)
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }>
                          {partner.availability_status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{partner.phone}</span>
                        </div>
                        {partner.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{partner.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <p className="font-bold text-sm">{partner.rating?.toFixed(1) || '0.0'}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Deliveries</p>
                          <p className="font-bold text-sm">{partner.successful_deliveries || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Success</p>
                          <p className="font-bold text-sm text-green-600">
                            {partner.total_deliveries > 0
                              ? ((partner.successful_deliveries / partner.total_deliveries) * 100).toFixed(0)
                              : 0
                            }%
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRemovePartner(partner.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available">
            {availablePartners.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Available Partners</h3>
                  <p className="text-gray-500">All verified delivery partners are already in your team!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePartners.map((partner) => (
                  <Card key={partner.id} className="border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {partner.full_name[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{partner.full_name}</h3>
                            <p className="text-xs text-gray-600">{partner.vehicle_type}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{partner.phone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <p className="font-bold text-sm">{partner.rating?.toFixed(1) || 'New'}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Deliveries</p>
                          <p className="font-bold text-sm">{partner.successful_deliveries || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Partners</p>
                          <p className="font-bold text-sm">
                            {partner.partnered_retailers?.filter(pr => pr.partnership_status === 'approved').length || 0}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={() => handleInvitePartner(partner)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to My Team
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite Confirmation Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Delivery Partner</DialogTitle>
              <DialogDescription>
                Are you sure you want to add {selectedPartner?.full_name} to your delivery team?
              </DialogDescription>
            </DialogHeader>
            
            {selectedPartner && (
              <div className="py-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    <strong>{selectedPartner.full_name}</strong> will be notified via SMS and can start accepting your delivery orders immediately.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmInvite}
                disabled={inviting}
                className="bg-green-600 hover:bg-green-700"
              >
                {inviting ? "Adding..." : "Confirm & Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}