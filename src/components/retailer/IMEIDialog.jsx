import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScannerView from "@/components/scanner/ScannerView";

export default function IMEIDialog({
  open,
  imeiStep,
  imeiValue,
  setImeiValue,
  recording,
  videoRecorded,
  submitting,
  showScanner,
  isActive,
  onStartRecording,
  onStopRecording,
  onScan,
  onSaveImei,
  onConfirmVideo,
  onClose,
  onToggleScanner,
  setIsActive,
}) {
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {imeiStep === "imei" ? "📱 Scan / Enter IMEI" : "🎥 Record Packaging Video"}
            </DialogTitle>
            <DialogDescription>
              {imeiStep === "imei"
                ? "Scan or manually enter the IMEI number"
                : "Record a sealed-box packaging video"}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1 — IMEI */}
          {imeiStep === "imei" && (
            <div className="space-y-4 py-4">
              <Label>IMEI Number</Label>
              <Input
                placeholder="Enter IMEI"
                maxLength={15}
                value={imeiValue}
                onChange={(e) =>
                  setImeiValue(e.target.value.replace(/\D/g, ""))
                }
              />
              <Button
                variant="outline"
                disabled={showScanner}
                onClick={onToggleScanner}
              >
                📷 Scan IMEI
              </Button>
            </div>
          )}

          {/* STEP 2 — VIDEO */}
          {imeiStep === "video" && (
            <div className="space-y-4 py-4">
              <div className="relative w-full max-w-lg aspect-video bg-black rounded-md overflow-hidden">
                <video
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onStartRecording}
                  disabled={recording}
                >
                  🎬 Start
                </Button>
                <Button
                  variant="outline"
                  onClick={onStopRecording}
                  disabled={!recording}
                >
                  ⏹ Stop
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>

            {imeiStep === "imei" ? (
              <Button
                className="flex-1"
                disabled={imeiValue.length !== 15 || submitting}
                onClick={onSaveImei}
              >
                Save IMEI
              </Button>
            ) : (
              <Button
                className="flex-1 bg-emerald-600"
                disabled={!videoRecorded}
                onClick={onConfirmVideo}
              >
                Confirm & Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <ScannerView
              isActive={showScanner}
              onScan={onScan}
            />
            <button
              onClick={() => {
                setIsActive(false);
                onToggleScanner();
              }}
              className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}