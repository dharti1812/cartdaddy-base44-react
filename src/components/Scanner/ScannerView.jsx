import React, { useEffect, useRef, useState, useCallback } from "react";
import { CameraOff, SwitchCamera, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScannerView({ isActive, onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const scannedRef = useRef(false);
  const detectorRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  const stopAll = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStarted(false);
  }, []);

  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    if (!video || !canvas || !detector || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    detector
      .detect(canvas)
      .then((barcodes) => {
        if (barcodes.length > 0 && !scannedRef.current) {
          scannedRef.current = true;
          const b = barcodes[0];
          if (navigator.vibrate) navigator.vibrate(50);
          stopAll();
          onScanRef.current({ value: b.rawValue, format: b.format });
        } else {
          animFrameRef.current = requestAnimationFrame(scanFrame);
        }
      })
      .catch(() => {
        animFrameRef.current = requestAnimationFrame(scanFrame);
      });
  }, [stopAll]);

  const startCamera = useCallback(
    async (facing) => {
      stopAll();
      scannedRef.current = false;
      setError(null);

      // Check BarcodeDetector support
      if (!("BarcodeDetector" in window)) {
        setError("Your browser does not support barcode scanning. Please use Chrome on Android.");
        return;
      }

      // Create detector
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: [
            "code_128",
            "code_39",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "itf",
            "qr_code",
            "data_matrix",
          ],
        });
      } catch (e) {
        setError("Could not create barcode detector: " + e.message);
        return;
      }

      // Get camera stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStarted(true);
        animFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access and try again.");
        } else {
          setError("Could not access camera: " + err.message);
        }
      }
    },
    [stopAll, scanFrame]
  );

  useEffect(() => {
    if (!isActive) {
      stopAll();
      return;
    }
    startCamera(facingMode);
    return () => stopAll();
  }, [isActive]);

  const handleSwitchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const handleClose = () => {
    stopAll();
    if (onClose) onClose();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white p-6 text-center bg-black">
        <CameraOff className="w-16 h-16 text-red-400" />
        <p className="text-lg font-semibold">Camera Error</p>
        <p className="text-sm text-white/70 max-w-xs">{error}</p>
        <Button
          onClick={() => startCamera(facingMode)}
          className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          <Camera className="w-4 h-4 mr-2" /> Try Again
        </Button>
        {onClose && (
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-white/70 hover:text-white"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan frame overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-80 h-36 mb-4">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br" />
          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-anim" />
        </div>
        <p className="text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          {started ? "Align IMEI barcode within the frame" : "Starting camera..."}
        </p>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Switch camera */}
      <div className="absolute bottom-8 flex justify-center w-full z-50">
        <Button
          onClick={handleSwitchCamera}
          size="icon"
          className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white"
        >
          <SwitchCamera className="w-5 h-5" />
        </Button>
      </div>

      <style>{`
        .scanline-anim {
          animation: scanline 2s ease-in-out infinite;
          top: 50%;
          position: absolute;
        }
        @keyframes scanline {
          0%, 100% { top: 10%; opacity: 0.5; }
          50% { top: 85%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}