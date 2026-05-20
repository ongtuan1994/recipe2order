"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  labels: {
    upload: string;
    remove: string;
    uploadFailed: string;
  };
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  labels,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? labels.uploadFailed);
        return;
      }
      onChange(data.url);
    } catch {
      toast.error(labels.uploadFailed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {value ? (
        <div className="relative inline-block">
          <div className="relative h-32 w-32 overflow-hidden rounded-md border bg-muted">
            <Image
              src={value}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow"
            onClick={() => onChange(null)}
            aria-label={labels.remove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handlePick}
          disabled={uploading}
          className="h-32 w-32 flex-col gap-2"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs">{labels.upload}</span>
        </Button>
      )}
    </div>
  );
}
