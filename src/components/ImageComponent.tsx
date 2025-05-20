"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ImageCropper to avoid SSR issues
const ImageCropper = dynamic(() => import("@/components/ImageCropper"), {
  ssr: false,
});

interface ImageComponentProps {
  onFileSelect: (file: string | null) => void; // Now returns base64
}

const ImageComponent: React.FC<ImageComponentProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = (cropped: string) => {
    setPreview(cropped);
    onFileSelect(cropped); // return base64 string
    setCroppingImage(null);
  };

  const handleCropCancel = () => {
    setCroppingImage(null);
  };

  // In ImageComponent
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview); //
    };
  }, [preview]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-zinc-300">
        Project Image <span className="text-red-500">*</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="text-sm text-zinc-300 file:bg-zinc-700 file:text-white file:rounded file:px-3 file:py-1"
      />
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="mt-2 w-full max-w-xs rounded-lg border border-zinc-700"
        />
      )}

      {croppingImage && (
        <ImageCropper
          imageSrc={croppingImage}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
          aspect={16 / 9} // Or whatever ratio you want
        />
      )}
    </div>
  );
};

export default ImageComponent;
