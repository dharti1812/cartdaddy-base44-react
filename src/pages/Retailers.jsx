import React, { useState, useEffect } from "react";
import { RetailerApi } from "@/components/utils/retailerApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus, AlertCircle } from "lucide-react"; // AlertCircle added
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"; // New import
import { Alert, AlertDescription } from "@/components/ui/alert"; // New imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // New imports
import { Label } from "@/components/ui/label"; // New import

import RetailersList from "../components/retailers/RetailersList";
import RetailerDetails from "../components/retailers/RetailerDetails";
import CreateRetailerDialog from "../components/retailers/CreateRetailerDialog";

export default function RetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // New state variables for approval dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [retailerToApprove, setRetailerToApprove] = useState(null);

  useEffect(() => {
    loadRetailers();
  }, []);

  const loadRetailers = async () => {
    setLoading(true);
    const data = await RetailerApi.list();
    setRetailers(data);
    setLoading(false);
  };

  // New handler for approving a retailer
  const handleApprove = async (retailer) => {
    await RetailerApi.update(retailer.id, {
      onboarding_status: "approved",
      status: "active",
      admin_approved_at: new Date().toISOString(),
    });
    setShowApprovalDialog(false);
    setRetailerToApprove(null);
    loadRetailers(); // Reload retailers to reflect the change
  };

  // New handler for rejecting a retailer
  const handleReject = async (retailer, reason) => {
    await RetailerApi.update(retailer.id, {
      onboarding_status: "rejected",
      status: "suspended", // Or another appropriate status for rejected
      rejection_reason: reason || "Not approved by admin",
    });
    setShowApprovalDialog(false);
    setRetailerToApprove(null);
    loadRetailers(); // Reload retailers to reflect the change
  };

  const filteredRetailers = retailers.filter((retailer) => {
    const matchesSearch =
      !searchTerm ||
      retailer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retailer.phone?.includes(searchTerm) ||
      retailer.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Modified matchesStatus to include "pending" filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending"
        ? retailer.is_pending_approval
        : statusFilter === "online"
        ? retailer.availability_status === "online"
        : retailer.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Calculate pending approvals
  const pendingApprovals = retailers.filter((r) => r.is_pending_approval);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Seller Management</h1>
            <p className="text-white opacity-90 mt-1">
              Manage delivery sellers and their performance
            </p>
          </div>
          <div className="flex gap-2">
            {" "}
            {/* Added div for grouping buttons/badges */}
            {pendingApprovals.length > 0 && (
              <Badge className="bg-amber-500 text-white text-lg px-4 py-2">
                {pendingApprovals.length} Pending Approval
              </Badge>
            )}
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 font-bold"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Seller
            </Button>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-2 border-amber-500">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>
                {pendingApprovals.length} seller
                {pendingApprovals.length > 1 ? "s" : ""} waiting for approval.
              </strong>{" "}
              Review their details below.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {/* New "Pending" tab trigger with badge */}
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {pendingApprovals.length > 0 && (
                      <Badge className="ml-1 bg-amber-500 text-white text-xs">
                        {pendingApprovals.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="online">Online</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className={selectedRetailer ? "lg:col-span-2" : "lg:col-span-3"}>
            <RetailersList
              retailers={filteredRetailers}
              loading={loading}
              // Modified onSelectRetailer logic
              onSelectRetailer={(r) => {
                if (r.onboarding_status === "admin_approval_pending") {
                  setRetailerToApprove(r);
                  setShowApprovalDialog(true);
                  setSelectedRetailer(null); // Clear selected retailer when opening approval dialog
                } else {
                  setSelectedRetailer(r);
                  setRetailerToApprove(null);
                  setShowApprovalDialog(false);
                }
              }}
              selectedRetailerId={selectedRetailer?.id}
            />
          </div>
          {selectedRetailer && (
            <div>
              <RetailerDetails
                retailer={selectedRetailer}
                onClose={() => setSelectedRetailer(null)}
                onUpdate={loadRetailers}
              />
            </div>
          )}
        </div>

        {showCreateDialog && (
          <CreateRetailerDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              loadRetailers();
              setShowCreateDialog(false); // Ensure dialog closes
            }}
          />
        )}

        {/* Approval Dialog */}
        {showApprovalDialog && retailerToApprove && (
          <Dialog open onOpenChange={() => setShowApprovalDialog(false)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Approve Seller Application
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Full Name</Label>
                    <p className="text-lg">{retailerToApprove.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Phone</Label>
                    <p className="text-lg">{retailerToApprove.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <p className="text-lg">{retailerToApprove.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Vehicle</Label>
                    <p className="text-lg capitalize">
                      {retailerToApprove.vehicle_type}
                    </p>
                  </div>
                </div>

                {retailerToApprove.bank_account && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Bank Details
                    </Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Account:</span>
                        <p className="font-mono">
                          {retailerToApprove.bank_account.account_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">IFSC:</span>
                        <p className="font-mono">
                          {retailerToApprove.bank_account.ifsc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    Once approved, the seller will be notified and can start
                    accepting orders.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleReject(retailerToApprove)}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(retailerToApprove)}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  Approve Seller
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
