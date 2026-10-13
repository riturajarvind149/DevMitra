"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Video } from "lucide-react";

const IMAGE_MAX = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX = 35 * 1024 * 1024;  // 35 MB (base64 adds ~33% overhead → ~47 MB on wire, stays under 55 MB server limit)

export default function FileUploader({
  value,
  onChange,
  accept = "image/*,video/*",
  label = "Image / Video",
  placeholder = "https://example.com/image.png",
  previewHeight = 140,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isVideo = (src) =>
    src.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

  const processFile = (file) => {
    if (!file) return;
    const isVideoFile = file.type.startsWith("video/");
    const limit = isVideoFile ? VIDEO_MAX : IMAGE_MAX;
    const limitLabel = isVideoFile ? "35 MB" : "5 MB";

    if (file.size > limit) {
      setError(`File exceeds the ${limitLabel} limit. Please choose a smaller file.`);
      return;
    }
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result);
      setLoading(false);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <label className="block text-sm text-secondary font-medium mb-1.5">{label}</label>

      {/* Preview */}
      {value && (
        <div
          className="relative w-full rounded-sm overflow-hidden border border-subtle mb-3 surface-card"
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
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-sm flex items-center justify-center transition"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Drop zone / upload button */}
      <div
        className={`relative border-2 border-dashed rounded-sm p-5 transition cursor-pointer ${
          isDragging ? "border-amber-500 bg-amber-500/10" : "border-subtle surface-input hover:border-amber-500/50"
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
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-muted" />
              <Upload className="h-5 w-5 text-amber-500" />
              <Video className="h-5 w-5 text-muted" />
            </div>
          )}
          <p className="text-sm text-secondary">
            <span className="text-amber-500 font-semibold">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-muted font-mono">
            Photos and videos from your device, or paste a URL below
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400 font-mono" role="alert">{error}</p>
      )}

      {/* URL fallback input */}
      <div className="mt-2">
        <input
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted"
        />
      </div>
    </div>
  );
}
