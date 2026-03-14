import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkPreview({ url, onOpen, onDismiss }) {
  const getDomain = (urlStr) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  const isSuspicious = (urlStr) => {
    try {
      const url = new URL(urlStr);
      return url.hostname.length > 50 || urlStr.includes("bitly") || urlStr.includes("tinyurl");
    } catch {
      return true;
    }
  };

  const suspicious = isSuspicious(url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-24 left-4 right-4 z-20"
      >
        <div className={`rounded-xl backdrop-blur-xl border p-4 ${
          suspicious
            ? "bg-red-500/10 border-red-500/30"
            : "bg-green-500/10 border-green-500/30"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              suspicious ? "bg-red-500/20" : "bg-green-500/20"
            }`}>
              {suspicious ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <ExternalLink className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                suspicious ? "text-red-400" : "text-green-400"
              }`}>
                {suspicious ? "Verify Link" : "Safe Link"}
              </p>
              <p className="text-xs text-white/70 mt-1 font-mono truncate">
                {getDomain(url)}
              </p>
              <p className="text-xs text-white/50 mt-2 break-all">
                {url}
              </p>
            </div>
            <Button
              onClick={onDismiss}
              size="icon"
              variant="ghost"
              className="text-white/50 hover:text-white h-6 w-6 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={onDismiss}
              variant="outline"
              className="flex-1 text-white border-white/20 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={onOpen}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Open Link
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}