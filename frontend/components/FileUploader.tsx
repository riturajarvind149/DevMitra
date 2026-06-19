"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Video } from "lucide-react";

interface Props {
  value: string;             // current URL or base64 value
  onChange: (val: string) => void;
  accept?: string;           // e.g. "image/*,video/*"
  label?: string;
  placeholder?: string;
  previewHeight?: number;    // px
}

export default function FileUploader({
  value,
  onChange,
  accept = "image/*,video/*",
  label = "Image / Video",
  placeholder = "https://example.com/image.png",
  previewHeight = 140,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const isVideo = (src: string) =>
    src.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

  const processFile = (file: File) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setLoading(false);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>

      {/* Preview */}
      {value && (
        <div
          className="relative w-full rounded-xl overflow-hidden border border-gray-700 mb-3 bg-gray-800"
          style={{ height: previewHeight }}
        >
          {isVideo(value) ? (
            <video src={value} className="w-full h-full object-cover" controls={false} muted autoPlay loop playsInline />
          ) : (
            <img src={value} alt="Preview" className="w-full h-full object-cover"
              onError={() => onChange("")} />
          )}
          <button
            type="button"
            onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Drop zone / upload button */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-5 transition cursor-pointer ${
          isDragging ? "border-indigo-500 bg-indigo-900/20" : "border-gray-700 hover:border-indigo-600 hover:bg-gray-800/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          capture="environment" // opens camera on mobile
        />
        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          {loading ? (
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-gray-500" />
              <Upload className="h-5 w-5 text-indigo-400" />
              <Video className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <p className="text-sm text-gray-400">
            <span className="text-indigo-400 font-medium">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-gray-600">
            Photos and videos from your device, or paste a URL below
          </p>
        </div>
      </div>

      {/* URL fallback input */}
      <div className="mt-2">
        <input
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2 rounded-lg focus:border-indigo-500 focus:outline-none placeholder-gray-600"
        />
      </div>
    </div>
  );
}
