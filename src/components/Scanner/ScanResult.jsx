import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Copy, Check, QrCode, Barcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function isUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const formatLabels = {
  qr_code: "QR Code",
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  code_93: "Code 93",
  codabar: "Codabar",
  itf: "ITF",
  data_matrix: "Data Matrix",
  aztec: "Aztec",
  pdf417: "PDF 417",
};

export default function ScanResult({ result, onDismiss }) {
  const [copied, setCopied] = useState(false);
  const isLink = isUrl(result.value);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(result.value, "_blank", "noopener,noreferrer");
  };

  const IconComponent = result.format === "qr_code" ? QrCode : Barcode;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-20"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 pb-8 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                  {formatLabels[result.format] || result.format}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Just scanned</p>
              </div>
            </div>
            <Button
              onClick={onDismiss}
              size="icon"
              variant="ghost"
              className="text-gray-400 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-black/40 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-white text-sm font-mono break-all leading-relaxed">
              {result.value}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0 h-12 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </>
              )}
            </Button>
            {isLink && (
              <Button
                onClick={handleOpen}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white border-0 h-12 rounded-xl"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open Link
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}