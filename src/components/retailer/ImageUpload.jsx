import React, { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageUpload({ onImageSelected }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onImageSelected(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute top-24 left-0 right-0 z-20 flex justify-center px-4">
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white rounded-full px-4 gap-2 h-10"
      >
        <ImageIcon className="w-4 h-4" />
        <span className="text-sm">Upload Image</span>
      </Button>
      <input ref__={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}