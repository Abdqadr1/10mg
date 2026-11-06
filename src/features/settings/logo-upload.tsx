"use client";

import { useId, useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { Button } from "@/components/ui/button";
import type { Branding } from "@/types";

const MAX_BYTES = 256 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

interface LogoUploadProps {
  name: string;
  branding: Branding;
  value: string | null;
  onChange: (value: string | null) => void;
}

export function LogoUpload({ name, branding, value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Upload a PNG, JPG, SVG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Logo must be smaller than 256 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onChange(String(reader.result));
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" id={`${id}-label`}>
        Logo
      </p>
      <div className="flex items-center gap-4">
        <div className="rounded-lg border p-2">
          <TenantLogo tenant={{ name: name || "Institution", logoUrl: value, branding }} size="lg" />
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="sr-only"
            aria-labelledby={`${id}-label`}
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <ImageUp />
            Upload logo
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              <Trash2 />
              Use monogram
            </Button>
          )}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Square image, max 256 KB. Without a logo we generate a monogram in your primary colour.</p>
      )}
    </div>
  );
}
