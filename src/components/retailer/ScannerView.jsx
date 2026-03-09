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
  const lastScanRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const exposureRangeRef = useRef({ min: -2, max: 2 });
  const lastAutoAdjustRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const usePreprocessingRef = useRef(false);

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

  const startCamera = useCallback(async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );

    const backCamera =
      videoDevices.find((d) => d.label.toLowerCase().includes("back")) ||
      videoDevices.find((d) => d.label.toLowerCase().includes("rear")) ||
      videoDevices[videoDevices.length - 1];

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: backCamera?.deviceId
          ? { exact: backCamera.deviceId }
          : undefined,
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    streamRef.current = stream;

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();

    if (capabilities?.torch) setTorchSupported(true);

    if (capabilities?.exposureCompensation) {
      setExposureSupported(true);
      exposureRangeRef.current = {
        min: capabilities.exposureCompensation.min,
        max: capabilities.exposureCompensation.max,
      };
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    setScanning(true);
  } catch (err) {
    console.error("Camera error:", err);
    setHasCamera(false);
  }
}, []);

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

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isActive, startCamera, stopCamera]);

  const calculateBrightness = (imageData) => {
    const data = imageData.data;
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalBrightness += gray;
    }
    return totalBrightness / (data.length / 4);
  };

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
        Math.min(exposureRangeRef.current.max, exposure + step),
      );
    }
    if (Math.abs(newExposure - exposure) > 0.05) {
      setExposure(newExposure);
      try {
        const track = streamRef.current.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ exposureCompensation: newExposure }],
        });
      } catch (err) {}
    }
  };

  const preprocessFrame = (canvas, ctx, video) => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const brightness = calculateBrightness(imageData);
    autoAdjustExposure(brightness);
    const histogram = new Uint32Array(256);
    let totalPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
      );
      histogram[gray]++;
      totalPixels++;
    }
    let pixelCount = 0;
    let p1 = 0,
      p99 = 255;
    const target1 = totalPixels * 0.01;
    const target99 = totalPixels * 0.99;
    for (let i = 0; i < 256; i++) {
      pixelCount += histogram[i];
      if (pixelCount >= target1 && p1 === 0) p1 = i;
      if (pixelCount >= target99) {
        p99 = i;
        break;
      }
    }
    const range = Math.max(1, p99 - p1);
    for (let i = 0; i < data.length; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray = Math.max(0, Math.min(255, ((gray - p1) / range) * 255));
      const gamma = 0.6;
      gray = Math.pow(gray / 255, gamma) * 255;
      const sharpened = Math.min(255, gray * 1.3);
      data[i] = sharpened;
      data[i + 1] = sharpened;
      data[i + 2] = sharpened;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

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
          detectionSource = preprocessFrame(
            canvasRef.current,
            ctx,
            videoRef.current,
          );
        }
        const barcodes = await detectorRef.current.detect(detectionSource);
        if (barcodes.length > 0) {
          consecutiveFailuresRef.current = 0;
          const code = barcodes[0];
          const now = Date.now();
          if (
            code.rawValue !== lastScanRef.current ||
            now - lastScanTimeRef.current > 3000
          ) {
            lastScanRef.current = code.rawValue;
            lastScanTimeRef.current = now;
            onScan({ value: code.rawValue, format: code.format });
          }
        } else {
          consecutiveFailuresRef.current++;
          if (consecutiveFailuresRef.current >= 10)
            usePreprocessingRef.current = true;
        }
      } catch (err) {
        consecutiveFailuresRef.current++;
        if (consecutiveFailuresRef.current >= 10)
          usePreprocessingRef.current = true;
      }
      animationRef.current = requestAnimationFrame(detect);
    };
    animationRef.current = requestAnimationFrame(detect);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scanning, onScan]);

  const toggleFacing = async () => {
  const newMode = facingMode === "environment" ? "user" : "environment";
  setFacingMode(newMode);

  stopCamera();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: newMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  streamRef.current = stream;

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  }

  setScanning(true);
};

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newTorch = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: newTorch }] });
    setTorchOn(newTorch);
  };

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

  const handleExposureChange = async (delta) => {
    if (!streamRef.current || !exposureSupported) return;
    setAutoExposure(false);
    const track = streamRef.current.getVideoTracks()[0];
    const newExposure = Math.max(
      exposureRangeRef.current.min,
      Math.min(exposureRangeRef.current.max, exposure + delta),
    );
    setExposure(newExposure);
    await track.applyConstraints({
      advanced: [{ exposureCompensation: newExposure }],
    });
  };

  const toggleAutoExposure = () => setAutoExposure(!autoExposure);

  const handleWheel = async (e) => {
    e.preventDefault();
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    if (!capabilities?.zoom) return;
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newZoom = Math.max(
      1,
      Math.min(zoom + delta, capabilities.zoom.max || 4),
    );
    setZoom(newZoom);
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
  };

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

  if (!detectorRef.current && !("BarcodeDetector" in window)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-6">
        <CameraOff className="w-16 h-16" />
        <p className="text-lg font-medium text-center">
          Barcode Detection Not Supported
        </p>
        <p className="text-sm text-center max-w-xs">
          Your browser doesn't support the Barcode Detection API. Please use
          Chrome on Android or a supported browser.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-sm h-96 bg-black rounded-lg overflow-hidden border-2 border-cyan-400/30">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          onWheel={handleWheel}
          style={{ cursor: "zoom-in" }}
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-20">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            <div
              className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
              style={{
                animation: "scanline 2s ease-in-out infinite",
                top: "50%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 z-10 mt-8 flex-wrap">
        <Button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          size="icon"
          className="rounded-full w-12 h-12 bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white disabled:opacity-50"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          onClick={toggleFacing}
          size="icon"
          className="rounded-full w-12 h-12 bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white"
        >
          <SwitchCamera className="w-5 h-5" />
        </Button>
        <Button
          onClick={toggleTorch}
          disabled={!torchSupported}
          size="icon"
          className={`rounded-full w-12 h-12 backdrop-blur-md border border-white/20 text-white ${torchOn ? "bg-cyan-500/40 hover:bg-cyan-500/50" : "bg-white/15 hover:bg-white/25"} ${!torchSupported ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {torchOn ? (
            <ZapOff className="w-5 h-5" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
        </Button>
        <Button
          onClick={handleZoomIn}
          size="icon"
          className="rounded-full w-12 h-12 bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        {exposureSupported && (
          <>
            <Button
              onClick={toggleAutoExposure}
              size="icon"
              className={`rounded-full w-12 h-12 backdrop-blur-md border border-white/20 text-white ${autoExposure ? "bg-cyan-500/40 hover:bg-cyan-500/50" : "bg-white/15 hover:bg-white/25"}`}
            >
              <span className="text-xs font-bold">A</span>
            </Button>
            <Button
              onClick={() => handleExposureChange(-0.5)}
              disabled={autoExposure}
              size="icon"
              className="rounded-full w-12 h-12 bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white disabled:opacity-50"
            >
              <Moon className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => handleExposureChange(0.5)}
              disabled={autoExposure}
              size="icon"
              className="rounded-full w-12 h-12 bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white disabled:opacity-50"
            >
              <Sun className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {zoom > 1 && (
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-medium">
            {zoom.toFixed(1)}x
          </div>
        )}
        {exposure !== 0 && (
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-medium">
            EV {exposure.toFixed(1)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 15%; opacity: 0.4; }
          50% { top: 80%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
