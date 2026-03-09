import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScannerView({ onScan, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [exposure, setExposure] = useState(0);
  const [exposureSupported, setExposureSupported] = useState(false);
  const [autoExposure, setAutoExposure] = useState(true);
  const [webViewWarning, setWebViewWarning] = useState(false);

  const lastScanRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const exposureRangeRef = useRef({ min: -2, max: 2 });
  const lastAutoAdjustRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const usePreprocessingRef = useRef(false);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Likely a WebView that does not support camera
        setWebViewWarning(true);
        setHasCamera(false);
        return;
      }

      if (streamRef.current) stopCamera();

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();

      const advancedConstraints = {};
      if (caps?.focusMode?.includes("continuous"))
        advancedConstraints.focusMode = "continuous";
      if (caps?.whiteBalanceMode?.includes("continuous"))
        advancedConstraints.whiteBalanceMode = "continuous";
      if (Object.keys(advancedConstraints).length > 0)
        await track.applyConstraints({ advanced: [advancedConstraints] });

      setTorchSupported(caps?.torch || false);
      setExposureSupported(!!caps?.exposureCompensation);

      setScanning(true);
      setHasCamera(true);
      setWebViewWarning(false);
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);
      setWebViewWarning(true);
    }
  }, [facingMode, stopCamera]);

  // Toggle front/back camera
  const toggleFacing = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  // BarcodeDetector init
  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      detectorRef.current = null;
    } else {
      detectorRef.current = new window.BarcodeDetector({
        formats: [
          "qr_code",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "code_93",
          "codabar",
          "itf",
          "data_matrix",
          "aztec",
          "pdf417",
        ],
      });
    }
  }, []);

  // Start/stop camera based on isActive
  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  // Brightness calculation
  const calculateBrightness = (imageData) => {
    const data = imageData.data;
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return totalBrightness / (data.length / 4);
  };

  // Auto exposure
  const autoAdjustExposure = async (brightness) => {
    if (!autoExposure || !exposureSupported || !streamRef.current) return;
    const now = Date.now();
    if (now - lastAutoAdjustRef.current < 100) return;
    lastAutoAdjustRef.current = now;

    const targetBrightness = 128;
    const diff = targetBrightness - brightness;
    let newExposure = exposure;
    if (Math.abs(diff) > 20) {
      const step = Math.sign(diff) * Math.min(0.4, Math.abs(diff) / 100);
      newExposure = Math.max(
        exposureRangeRef.current.min,
        Math.min(exposureRangeRef.current.max, exposure + step)
      );
    }
    if (Math.abs(newExposure - exposure) > 0.05) {
      setExposure(newExposure);
      try {
        const track = streamRef.current.getVideoTracks()[0];
        await track.applyConstraints({ advanced: [{ exposureCompensation: newExposure }] });
      } catch {}
    }
  };

  // Preprocess frame
  const preprocessFrame = (canvas, ctx, video) => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const brightness = calculateBrightness(imageData);
    autoAdjustExposure(brightness);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Barcode detection loop
  useEffect(() => {
    if (!scanning || !detectorRef.current || !videoRef.current) return;

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        let detectionSource = videoRef.current;
        if (usePreprocessingRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          detectionSource = preprocessFrame(canvasRef.current, ctx, videoRef.current);
        }
        const barcodes = await detectorRef.current.detect(detectionSource);
        if (barcodes.length > 0) {
          consecutiveFailuresRef.current = 0;
          const code = barcodes[0];
          const now = Date.now();
          if (code.rawValue !== lastScanRef.current || now - lastScanTimeRef.current > 3000) {
            lastScanRef.current = code.rawValue;
            lastScanTimeRef.current = now;
            onScan({ value: code.rawValue, format: code.format });
          }
        } else {
          consecutiveFailuresRef.current++;
          if (consecutiveFailuresRef.current >= 10) usePreprocessingRef.current = true;
        }
      } catch {
        consecutiveFailuresRef.current++;
        if (consecutiveFailuresRef.current >= 10) usePreprocessingRef.current = true;
      }
      animationRef.current = requestAnimationFrame(detect);
    };

    animationRef.current = requestAnimationFrame(detect);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scanning, onScan]);

  // Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newTorch = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: newTorch }] });
    setTorchOn(newTorch);
  };

  // Zoom
  const handleZoomIn = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    if (!capabilities?.zoom) return;
    const newZoom = Math.min(zoom + 0.5, capabilities.zoom.max || 4);
    setZoom(newZoom);
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
  };
  const handleZoomOut = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newZoom = Math.max(zoom - 0.5, 1);
    setZoom(newZoom);
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
  };

  // Exposure
  const handleExposureChange = async (delta) => {
    if (!streamRef.current || !exposureSupported) return;
    setAutoExposure(false);
    const track = streamRef.current.getVideoTracks()[0];
    const newExposure = Math.max(
      exposureRangeRef.current.min,
      Math.min(exposureRangeRef.current.max, exposure + delta)
    );
    setExposure(newExposure);
    await track.applyConstraints({ advanced: [{ exposureCompensation: newExposure }] });
  };
  const toggleAutoExposure = () => setAutoExposure(!autoExposure);

  // Wheel zoom
  const handleWheel = async (e) => {
    e.preventDefault();
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    if (!capabilities?.zoom) return;
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newZoom = Math.max(1, Math.min(zoom + delta, capabilities.zoom.max || 4));
    setZoom(newZoom);
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
  };

  // Render WebView warning
  if (webViewWarning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <CameraOff className="w-16 h-16" />
        <p className="text-lg font-medium text-center">
          Camera not available in WebView
        </p>
        <p className="text-sm text-center max-w-xs">
          Please open this page in a real browser (Chrome, Edge, Safari) with camera access.
        </p>
      </div>
    );
  }

  // Render fallback if no camera
  if (!hasCamera) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <CameraOff className="w-16 h-16" />
        <p className="text-lg font-medium">Camera not available</p>
        <p className="text-sm text-center max-w-xs">
          Please allow camera access or try a device with a camera
        </p>
        <Button onClick={startCamera} variant="outline" className="mt-2">
          <Camera className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-sm h-96 bg-black rounded-lg overflow-hidden border-2 border-cyan-400/30">
        <video
          key={facingMode}
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          onLoadedMetadata={() => videoRef.current?.play()}
          onWheel={handleWheel}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}