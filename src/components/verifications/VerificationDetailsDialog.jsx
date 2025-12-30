import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  FileText,
  Camera,
  AlertCircle,
  Shield,
  Bike,
  Car,
  Download,
} from "lucide-react";
import { Retailer, DeliveryPartner } from "@/api/entities";
import { API_BASE_URL, ASSET_BASE_URL } from "@/config";
// import { generateVerificationReport } from "@/api/functions";

export default function VerificationDetailsDialog({
  item,
  currentAdmin,
  onClose,
  onSuccess,
}) {
  const [notes, setNotes] = useState("");
  const [physicalVerified, setPhysicalVerified] = useState(false);
  const [policeVerified, setPoliceVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRetailer = item.type === "retailer";
  const data = item.data;

  let shopPhotos = [];

  try {
    shopPhotos =
      typeof data.shop_photos === "string"
        ? JSON.parse(data.shop_photos)
        : data.shop_photos || [];
  } catch (error) {
    console.error("Error parsing shop_photos:", error);
    shopPhotos = [];
  }

  const resolveImageUrl = (url) => {
    if (!url) return "";

    const finalUrl = url.replace(
      /^https?:\/\/api\.cartdaddy\.in/i,
      ASSET_BASE_URL
    );

    return finalUrl;
  };

  console.log("Parsed shop photos1:", shopPhotos);
  const handleDownloadReport = async () => {
    // try {
    //   const response = await generateVerificationReport({
    //     entityType: isRetailer ? 'retailer' : 'delivery_partner',
    //     entityId: data.id
    //   });
    //   if (response.data.success) {
    //     const report = response.data.report;
    //     let reportString = `${report.reportType}\n`;
    //     reportString += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n`;
    //     reportString += `By: ${report.generatedBy}\n\n`;
    //     reportString += `--- Details ---\n`;
    //     reportString += `Name: ${report.entityName}\n`;
    //     if (report.businessName) reportString += `Business: ${report.businessName}\n`;
    //     reportString += `Phone: ${report.phone}\n`;
    //     reportString += `Email: ${report.email}\n\n`;
    //     reportString += `--- Verification Status ---\n`;
    //     Object.keys(report.verificationStatus).forEach(key => {
    //         reportString += `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${report.verificationStatus[key]}\n`;
    //     });
    //     const blob = new Blob([reportString], { type: 'text/plain' });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `${report.entityName}_verification_report.txt`;
    //     a.click();
    //     URL.revokeObjectURL(url);
    //   } else {
    //     throw new Error(response.data.error);
    //   }
    // } catch (e) {
    //   setError("Failed to generate report: " + e.message);
    // }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      if (isRetailer) {
        const response = await fetch(
          `${API_BASE_URL}/api/retailers/${data.id}/approveByAdmin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              onboarding_status: "approved",
              status: "active",
              admin_approved_by: currentAdmin.id,
              admin_approved_at: new Date().toISOString(),
              admin_notes: notes,
              is_physically_verified: physicalVerified ? 1 : 0,
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Retailer approval failed");
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/api/delivery-partners/${data.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              onboarding_status: "approved",
              status: "active",
              is_police_verified: policeVerified ? 1 : 0,
              admin_approved_by: currentAdmin.id,
              admin_approved_at: new Date().toISOString(),
              admin_notes: notes,
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Approval failed");
        }
      }
      onSuccess();
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!data || !data.id) {
      console.error("❌ No delivery partner data found");
      setError("Unable to reject: missing delivery partner information.");
      return;
    }

    if (!notes) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      const rejectedData = {
        onboarding_status: "rejected",
        status: "suspended",
        is_verified: isRetailer
          ? physicalVerified
            ? 1
            : 0
          : policeVerified
          ? 1
          : 0,

        admin_approved_by: currentAdmin.id,
        admin_approved_at: new Date().toISOString(),
        rejection_reason: notes,
        admin_notes: notes,
      };

      const api = isRetailer
        ? `${API_BASE_URL}/api/retailers/${data.id}/rejectByAdmin`
        : `${API_BASE_URL}/api/delivery-partners/${data.id}/reject`;

      const response = await fetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rejectedData),
      });

      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to reject partner");
      }

      console.log("✅ Rejection successful:", result);
      onSuccess();
    } catch (err) {
      console.error("❌ Rejection error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isRetailer ? (
                <>
                  <Building2 className="w-6 h-6 text-amber-600" /> Retailer
                  Verification
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6 text-green-600" /> Delivery Partner
                  Verification
                </>
              )}
            </div>
            {/* <Button variant="outline" size="sm" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Report
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Full Name</Label>
                <p className="font-medium">
                  {data?.user?.name
                    ? data.user.name.charAt(0).toUpperCase() +
                      data.user.name.slice(1)
                    : "N/A"}
                </p>
              </div>
              {isRetailer && data?.name && (
                <div>
                  <Label className="text-gray-500">Business Name</Label>
                  <p className="font-medium">{data?.name || "N/A"}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">Phone</Label>
                <p className="font-medium flex items-center gap-2">
                  {data?.user?.phone || "N/A"}
                  {data?.user?.phone && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Email</Label>
                <p className="font-medium flex items-center gap-2">
                  {data?.user?.email || "N/A"}
                  {data?.user?.email && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* API Verification Data */}
          {isRetailer ? (
            <>
              {/* GST Verification */}
              {data?.gst_verified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" /> GST
                    Verification Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-500">GST Number</Label>
                      <p className="font-mono">
                        {data?.user?.gst_information?.GSTIN || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Business Name</Label>
                      <p className="font-medium">
                        {data?.user?.gst_information?.trade_name_of_business ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Owner Name</Label>
                      <p className="font-medium">
                        {data?.user?.gst_information?.legal_name_of_business ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Registration Date</Label>
                      <p className="font-medium">
                        {data?.user?.gst_information?.date_of_registration ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Verification */}
              {data?.bank_verified && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" /> Bank
                    Verification Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-500">Account Number</Label>
                      <p className="font-mono">{data?.bank_acc_no || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">IFSC Code</Label>
                      <p className="font-mono">
                        {data?.user?.bank_information?.ifsc || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Account Holder</Label>
                      <p className="font-medium">
                        {data?.bank_acc_name || "N/A"}
                      </p>
                    </div>
                    {/* <div>
                        <Label className="text-gray-500">Bank Name</Label>
                        <p className="font-medium">
                          {data?.bank_account?.bank_name || "N/A"}
                        </p>
                      </div> */}
                  </div>
                </div>
              )}

              {/* Additional Contacts */}
              {Array.isArray(data?.alternate_phones) &&
                data.alternate_phones.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Additional Contact Numbers
                    </h3>
                    <div className="space-y-2">
                      {data.alternate_phones.map((phone, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {phone?.number || "N/A"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {phone?.label || "Other"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          ) : (
            <>
              {/* DL Verification */}
              {data?.dl_number && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Driving License Verification Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-500">DL Number</Label>
                      <p className="font-mono">{data.dl_number}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Name on DL</Label>
                      <p className="font-medium">{data.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Date of Birth</Label>
                      <p className="font-medium">{data.dob}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Valid Until</Label>
                      <p className="font-medium">
                        {data.dl_validity.non_transport?.to}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">Vehicle Type</Label>
                    <p className="font-medium flex items-center gap-2">
                      {data.vehicle_type === "2_wheeler" ? (
                        <>
                          <Bike className="w-4 h-4" /> 2-Wheeler
                        </>
                      ) : (
                        <>
                          <Car className="w-4 h-4" /> 4-Wheeler
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Vehicle Number</Label>
                    <p className="font-mono">{data.vehicle_number}</p>
                  </div>
                </div>
              </div>

              {/* Bank Verification */}
              {(isRetailer && data?.user?.bank_information) ||
              (!isRetailer && data?.user?.bank_information) ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Bank Verification Results
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-500">Account Number</Label>
                      <p className="font-mono">
                        ****
                        {isRetailer
                          ? data.user.bank_information.account_number
                          : data.user?.bank_information?.bank_acc_no}
                      </p>
                    </div>

                    <div>
                      <Label className="text-gray-500">IFSC Code</Label>
                      <p className="font-mono">
                        {isRetailer
                          ? data?.user?.bank_information?.ifsc ?? "-"
                          : data?.user?.bank_information?.ifsc ?? "-"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-gray-500">Account Holder</Label>
                      <p className="font-medium">
                        {isRetailer
                          ? data.user.bank_information.account_holder_name
                          : data?.user?.bank_information?.bank_acc_name}
                      </p>
                    </div>

                    {/* <div>
                        <Label className="text-gray-500">Bank Name</Label>
                        <p className="font-medium">
                          {isRetailer
                            ? data.user.bank_information.bank_name
                            : data.bank_information.bank_name}
                        </p>
                      </div> */}
                  </div>
                </div>
              ) : null}

              {/* Additional Contacts */}
              {data.alternate_phone && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Additional Contact Number
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {data.alternate_phone}
                      </span>
                      {/* <Badge variant="outline" className="text-xs">{data.alternate_phone.label}</Badge> */}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Shop Photos / Selfie / Documents */}
          {((isRetailer &&
            data.shop_photos &&
            (Array.isArray(data.shop_photos)
              ? data.shop_photos.length > 0
              : !!data.shop_photos)) ||
            !isRetailer) && (
            <div>
              <h3 className="font-semibold mb-3">
                {isRetailer ? "Shop Photos" : "Selfie & Documents"}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {isRetailer ? (
                  shopPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      <a
                        href={resolveImageUrl(photo.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={resolveImageUrl(photo.url)}
                          alt={photo.type || `Shop photo ${i + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500"
                        />
                      </a>
                      {photo.type && (
                        <Badge className="absolute top-2 left-2 bg-[#F4B321] text-gray-900">
                          {photo.type}
                        </Badge>
                      )}
                      {photo.location && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Geo-tagged
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    {data?.selfie_file?.file_name && (
                      <div className="relative">
                        <a
                          href={`${ASSET_BASE_URL}/${data?.selfie_file?.file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={`${ASSET_BASE_URL}/${data?.selfie_file?.file_name}`}
                            alt="Selfie"
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500"
                          />
                        </a>
                        <Badge className="absolute top-2 left-2 bg-[#F4B321] text-gray-900">
                          Selfie
                        </Badge>
                      </div>
                    )}
                    {(() => {
                      if (!data) return null;

                      const docs = [];
                      const kyc = data.kyc_documents;
                      if (kyc.dl_front) {
                        docs.push({
                          type: "dl_front",
                          url: `${ASSET_BASE_URL}/${kyc.dl_front.file_name}`,
                        });
                      }
                      if (kyc.pan) {
                        docs.push({
                          type: "pan",
                          url: `${ASSET_BASE_URL}/${kyc.pan.file_name}`,
                        });
                      }
                      if (kyc.aadhar_front) {
                        docs.push({
                          type: "aadhar_front",
                          url: `${ASSET_BASE_URL}/${kyc.aadhar_front.file_name}`,
                        });
                      }
                      if (kyc.vehicle_rc) {
                        docs.push({
                          type: "vehicle_rc",
                          url: `${ASSET_BASE_URL}/${kyc.vehicle_rc.file_name}`,
                        });
                      }

                      return docs.length > 0 ? (
                        docs.map((doc, i) => (
                          <div key={i} className="relative">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={doc.url}
                                alt={doc.type}
                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500"
                                // onError={(e) =>
                                //   (e.target.src = "/placeholder.jpg")
                                // }
                              />
                            </a>
                            <Badge className="absolute top-2 left-2 bg-gray-600 text-white capitalize">
                              {doc.type?.replace("_", " ")}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No documents uploaded</p>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* {isRetailer && data.documents && data.documents.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">KYC Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.documents.map((doc, i) => (
                    <div key={i} className="relative">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500"
                        />
                      </a>
                      <Badge className="absolute top-2 left-2 bg-gray-600 text-white capitalize">
                        {doc.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

          {/* Manual Verification Checkboxes */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3">Manual Verification</h3>
            <div className="space-y-3">
              {isRetailer ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="physical"
                    checked={physicalVerified}
                    onCheckedChange={setPhysicalVerified}
                  />
                  <Label htmlFor="physical" className="cursor-pointer">
                    Mark as Physically Verified (Shop visited and confirmed)
                  </Label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="police"
                    checked={policeVerified}
                    onCheckedChange={setPoliceVerified}
                  />
                  <Label htmlFor="police" className="cursor-pointer">
                    Mark as Police Verified (Background check completed)
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <Label htmlFor="notes">
              Admin Notes{" "}
              {!notes && (
                <span className="text-red-500">(Required for rejection)</span>
              )}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your verification notes or rejection reason..."
              className="h-24 mt-2"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {loading ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {loading ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
