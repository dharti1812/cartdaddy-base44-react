import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, XCircle, CheckCircle, Eye, Phone } from "lucide-react";
import { rejectionsApi } from "@/components/utils/rejectionsApi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/config";

export default function RejectionsPage() {
  const [rejections, setRejections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [zoomPhoto, setZoomPhoto] = useState({
    open: false,
    src: null,
  });

  const [preview, setPreview] = useState({
    open: false,
    photo: null,
    video: null,
  });

  // Confirm Modal State
  const [confirm, setConfirm] = useState({
    open: false,
    rejectionId: null,
    action: null, // "approve" or "reject"
  });

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    loadRejections(page);
  }, [page]);

  // Load Rejections
  const loadRejections = async (pageNo = 1) => {
    setLoading(true);
    try {
      const data = await rejectionsApi.list(pageNo, perPage);
      if (data.success) {
        setRejections(data.data);
        setLastPage(Math.ceil(data.count / perPage));
        setPage(pageNo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Approve Appeal
  const handleApprove = async (rejectionId) => {
    setActionLoadingId(rejectionId);

    try {
      await rejectionsApi.approve(rejectionId);

      setRejections((prev) => prev.filter((item) => item.id !== rejectionId));

      toast.success("Appeal Approved Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Approval failed. Please try again.");
    } finally {
      setActionLoadingId(null);
      setConfirm({ open: false, rejectionId: null, action: null });
    }
  };

  // Reject Appeal
  const handleReject = async (rejectionId) => {
    setActionLoadingId(rejectionId);

    try {
      await rejectionsApi.reject(rejectionId);

      setRejections((prev) => prev.filter((item) => item.id !== rejectionId));

      toast.success("Appeal Rejected Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Reject failed. Please try again.");
    } finally {
      setActionLoadingId(null);
      setConfirm({ open: false, rejectionId: null, action: null });
    }
  };

  // Date Format
  const formatDMY = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#064d54] text-white">
        Loading Rejections...
      </div>
    );
  }

  return (
    <>
      <div className="p-6 min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54]">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white">
            Rejected IMEI / Sealed Box Video Appeals
          </h1>

          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <CardTitle>Verification Rejections</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>#</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Seller Info</TableHead>
                    <TableHead>Delivery Boy Info</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Appeal Status</TableHead>
                    <TableHead>Rejected Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rejections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6">
                        No rejections found
                      </TableCell>
                    </TableRow>
                  )}

                  {rejections.map((rejection, index) => (
                    <TableRow key={rejection.id}>
                      <TableCell>{(page - 1) * perPage + index + 1}</TableCell>

                      <TableCell className="font-semibold">
                        #{rejection.order_id}
                      </TableCell>

                      {/* Seller */}
                      <TableCell>
                        <div>{rejection.seller_name || "-"}</div>
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Phone className="w-4 h-4" />
                          {rejection.seller_phone || "-"}
                        </div>
                      </TableCell>

                      {/* Delivery */}
                      <TableCell>
                        <div>{rejection.delivery_name || "-"}</div>
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Phone className="w-4 h-4" />
                          {rejection.delivery_mobile || "-"}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge variant="destructive">
                          {rejection.type.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>Attempt {rejection.attempt_no}</TableCell>

                      {/* Reason */}
                      <TableCell className="max-w-xs truncate">
                        {rejection.reason}
                      </TableCell>

                      {/* Appeal Status */}
                      <TableCell>
                        {rejection.appeal_status === "pending" && (
                          <Badge className="bg-orange-500 text-white">
                            Pending
                          </Badge>
                        )}

                        {rejection.appeal_status === "approved" && (
                          <Badge className="bg-green-600 text-white">
                            Approved
                          </Badge>
                        )}

                        {rejection.appeal_status === "rejected" && (
                          <Badge className="bg-red-600 text-white">
                            Rejected
                          </Badge>
                        )}

                        {(!rejection.appeal_status ||
                          rejection.appeal_status === "none") && (
                          <span className="text-gray-500 text-sm">
                            No Appeal
                          </span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDMY(rejection.created_at)}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="flex gap-2">
                        {/* View */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPreview({
                              open: true,
                              photo: rejection.photo_path,
                              video: rejection.video_path,
                            })
                          }
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>

                        {/* Only Pending Appeals */}
                        {rejection.appeal_status === "pending" && (
                          <>
                            {/* Approve */}
                            <div className="relative inline-block group">
                              <Button
                                size="sm"
                                disabled={actionLoadingId === rejection.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    rejectionId: rejection.id,
                                    action: "approve",
                                  })
                                }
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>

                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition duration-200 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                Approve
                              </span>
                            </div>

                            <div className="relative inline-block group">
                              <Button
                                size="sm"
                                disabled={actionLoadingId === rejection.id}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    rejectionId: rejection.id,
                                    action: "reject",
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>

                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition duration-200 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                Reject
                              </span>
                            </div>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center p-4 border-t">
                <span className="text-sm text-gray-600">
                  Page {page} of {lastPage}
                </span>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === lastPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {preview.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] max-w-2xl p-6 relative">
            {/* Close Button */}
            <button
              onClick={() =>
                setPreview({ open: false, photo: null, video: null })
              }
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">View Rejection Details</h2>

            
            {preview.photo && (
              <div className="mb-4">
                <p className="font-medium mb-2">Photo:</p>
                <img
                  src={`${API_BASE_URL}/public/${preview.photo}`}
                  alt="Appeal Photo"
                  className="w-full max-h-80 object-contain rounded-lg border"
                   onClick={() =>
                    setZoomPhoto({
                      open: true,
                      src: `${API_BASE_URL}/public/${preview.photo}`,
                    })
                  }
                />
              </div>
            )}

            
            {preview.video && (
              <div>
                <p className="font-medium mb-2">Video:</p>
                <video controls className="w-full max-h-80 rounded-lg border">
                  <source
                    src={`${API_BASE_URL}/public/${preview.video}`}
                    type="video/mp4"
                  />
                </video>
              </div>
            )}
          </div>
        </div>
      )}

      {zoomPhoto.open && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center"
          onClick={() => setZoomPhoto({ open: false, src: null })}
        >
          <img
            src={zoomPhoto.src}
            alt="Zoom"
            className="max-h-[90vh] max-w-[90vw] rounded-lg border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>

            <p className="mb-6">
              Are you sure you want to{" "}
              <span className="font-bold">
                {confirm.action === "approve" ? "APPROVE" : "REJECT"}
              </span>{" "}
              this appeal?
            </p>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  setConfirm({
                    open: false,
                    rejectionId: null,
                    action: null,
                  })
                }
              >
                Cancel
              </Button>

              <Button
                className={
                  confirm.action === "approve"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                onClick={() =>
                  confirm.action === "approve"
                    ? handleApprove(confirm.rejectionId)
                    : handleReject(confirm.rejectionId)
                }
              >
                Yes, {confirm.action === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
