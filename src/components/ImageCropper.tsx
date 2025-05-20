// components/ImageCropper.tsx
"use client";

import Cropper from "react-easy-crop";
import { useCallback, useState } from "react";
import getCroppedImg from "@/utils/cropImage";
import type { Area } from "react-easy-crop";

export default function ImageCropper({
  imageSrc,
  onCropDone,
  onCancel,
  aspect = 1,
}: {
  imageSrc: string;
  onCropDone: (cropped: string) => void;
  onCancel: () => void;
  aspect?: number;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropDone(cropped);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="relative w-[90vw] h-[70vh] bg-zinc-900 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-red-500 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            Crop
          </button>
        </div>
      </div>
    </div>
  );
}
