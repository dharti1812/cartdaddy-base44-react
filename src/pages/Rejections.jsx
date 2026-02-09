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
  const [approvingId, setApprovingId] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState({
    open: false,
    src: null,
  });

  const [preview, setPreview] = useState({
    open: false,
    photo: null,
    video: null,
  });

  const [confirm, setConfirm] = useState({
    open: false,
    rejectionId: null,
  });

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    loadRejections(page);
  }, [page]);

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

  const handleApprove = async (rejectionId) => {
    setApprovingId(rejectionId);
    try {
      await rejectionsApi.approve(rejectionId);
      setRejections((prev) => prev.filter((item) => item.id !== rejectionId));
      toast.success("Successfully Approved!!");
    } catch (error) {
      console.error(error);
      toast.error("Approval failed. Please try again.");
    } finally {
      setApprovingId(null);
      setConfirm({ open: false, rejectionId: null });
    }
  };

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
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Rejected IMEI / Sealed box Video
          </h1>

          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                Verification Rejections
              </CardTitle>
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
                    <TableHead>Rejected Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rejections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
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

                      <TableCell>
                        <div>{rejection.seller_name || "-"}</div>
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Phone className="w-4 h-4" />{" "}
                          {rejection.seller_phone || "-"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>{rejection.delivery_name || "-"}</div>
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Phone className="w-4 h-4" />{" "}
                          {rejection.delivery_mobile || "-"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="destructive">
                          {rejection.type.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>Attempt {rejection.attempt_no}</TableCell>

                      <TableCell className="max-w-xs truncate">
                        {rejection.reason}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDMY(rejection.created_at)}
                        </div>
                      </TableCell>

                      <TableCell className="flex gap-2">
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

                        <Button
                          size="sm"
                          disabled={approvingId === rejection.id}
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            setConfirm({
                              open: true,
                              rejectionId: rejection.id,
                            })
                          }
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

      {/* PREVIEW MODAL */}
      {preview.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative shadow-xl">
            {/* Close Button */}
            <button
              onClick={() =>
                setPreview({ open: false, photo: null, video: null })
              }
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              IMEI / Video Verification Preview
            </h2>

            {/* Photo Preview */}
            {preview.photo && (
              <div className="mb-6">
                <p className="font-medium mb-2 text-sm sm:text-base">
                  📷 Rejected Photo
                </p>

                <img
                  src={`${API_BASE_URL}/public/${preview.photo}`}
                  alt="Verification"
                  onClick={() =>
                    setZoomPhoto({
                      open: true,
                      src: `${API_BASE_URL}/public/${preview.photo}`,
                    })
                  }
                  className="w-full max-h-[250px] object-contain rounded-xl border cursor-zoom-in hover:scale-[1.02] transition"
                />
              </div>
            )}

            {/* Video Preview */}
            {preview.video && (
              <div>
                <p className="font-medium mb-2 text-sm sm:text-base">
                  🎥 Rejected Video
                </p>

                <video
                  src={`${API_BASE_URL}/public/${preview.video}`}
                  controls
                  className="w-full max-h-[250px] sm:max-h-[250px] object-contain rounded-xl border"
                />
              </div>
            )}

            {/* No Media */}
            {!preview.photo && !preview.video && (
              <p className="text-center text-gray-500 mt-6">
                No photo or video available
              </p>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
            <p className="mb-6">Do you want to APPROVE this verification?</p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setConfirm({ open: false, rejectionId: null })}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(confirm.rejectionId)}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {zoomPhoto.open && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center px-3">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => setZoomPhoto({ open: false, src: null })}
              className="absolute top-3 right-3 text-white text-3xl font-bold hover:text-gray-300"
            >
              ✕
            </button>

            <div className="overflow-auto max-h-[90vh] rounded-xl">
              <img
                src={zoomPhoto.src}
                alt="Zoom Preview"
                className="w-full object-contain rounded-xl cursor-zoom-out"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
