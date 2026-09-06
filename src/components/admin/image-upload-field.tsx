"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/components/admin/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUpload } from "@/lib/api/fetcher";
import { isExternalImage } from "@/lib/media/url";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Field id — generated when omitted. */
  id?: string;
  hint?: string;
  /** Thumbnail shape; product shots are square, section art is wide. */
  aspect?: "square" | "wide";
  /** `stacked` shows a large drop-zone preview above the controls (product form). */
  layout?: "inline" | "stacked";
  className?: string;
}

/**
 * One image control for every admin form: upload a file (stored by the media
 * API), drop one onto the preview, or paste a URL — with a live thumbnail and
 * a clear button.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  id,
  hint,
  aspect = "square",
  layout = "inline",
  className,
}: ImageUploadFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be uploaded.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const asset = await apiUpload<MediaAsset>("/api/admin/media", form);
      onChange(asset.url);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const stacked = layout === "stacked";

  const preview = (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      disabled={uploading}
      aria-label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 outline-none transition-[box-shadow,background-color] focus-visible:ring-3 focus-visible:ring-ring/50",
        stacked ? "w-full" : aspect === "square" ? "size-20" : "h-20 w-32",
        stacked && (aspect === "square" ? "aspect-square" : "aspect-[16/9]"),
        dragging && "bg-primary/10 ring-2 ring-primary",
      )}
    >
      {value ? (
        <>
          <Image
            src={value}
            alt=""
            fill
            sizes={stacked ? "320px" : "128px"}
            className="object-cover"
            unoptimized={isExternalImage(value)}
          />
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Upload className="mr-1.5 size-4" /> Replace
          </span>
        </>
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImageIcon className={cn(stacked ? "size-7" : "size-5")} aria-hidden />
          {stacked && <span className="text-xs">Drop an image or click to upload</span>}
        </span>
      )}
      {uploading && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-medium">
          Uploading…
        </span>
      )}
    </button>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className={cn("flex gap-3", stacked && "flex-col")}>
        {preview}
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={fieldId}
            value={value}
            placeholder="https://… or upload a file"
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload data-icon="inline-start" aria-hidden />
              {uploading ? "Uploading…" : "Upload image"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onChange("")}
              >
                <X data-icon="inline-start" aria-hidden />
                Remove
              </Button>
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
