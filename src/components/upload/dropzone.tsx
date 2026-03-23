"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, CheckCircle, AlertCircle, Loader2, ImageIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface FileUploadItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface DropzoneProps {
  workId: string;
  onUploadComplete?: () => void;
}

export function Dropzone({ workId, onUploadComplete }: DropzoneProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileUploadItem[] = Array.from(newFiles)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        id: crypto.randomUUID(),
        status: "pending" as const,
        progress: 0,
      }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function uploadAll() {
    setUploading(true);
    const userId = (await supabase.auth.getUser()).data.user!.id;

    for (const item of files) {
      if (item.status === "done") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 50 } : f))
      );

      try {
        const ext = item.file.name.split(".").pop() || "png";
        const assetId = crypto.randomUUID();
        const path = `works/${workId}/original/${assetId}.${ext}`;

        const { error: storageError } = await supabase.storage
          .from("jvc")
          .upload(path, item.file, { contentType: item.file.type, upsert: false });

        if (storageError) throw storageError;

        const { error: dbError } = await supabase.from("assets").insert({
          id: assetId,
          owner_id: userId,
          work_id: workId,
          kind: "original",
          bucket: "jvc",
          path,
          mime_type: item.file.type,
          bytes: item.file.size,
        });

        if (dbError) throw dbError;

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "done", progress: 100 } : f))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "error", error: msg } : f))
        );
      }
    }

    setUploading(false);
    onUploadComplete?.();
  }

  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 transition-colors ${
          dragOver
            ? "border-brand-400 bg-brand-950/30"
            : "border-surface-600 hover:border-surface-500 hover:bg-surface-800/30"
        }`}
      >
        <Upload className={`mb-3 h-10 w-10 ${dragOver ? "text-brand-400" : "text-surface-500"}`} />
        <p className="text-sm font-medium text-surface-300">
          Drop images here or click to browse
        </p>
        <p className="mt-1 text-xs text-surface-500">
          Supports JPG, PNG, GIF, WebP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">
              {files.length} file{files.length !== 1 ? "s" : ""} &middot;{" "}
              {doneCount} uploaded &middot; {pendingCount} pending
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFiles([])}
                className="btn-ghost text-xs"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={uploadAll}
                className="btn-primary text-xs"
                disabled={uploading || pendingCount === 0}
              >
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Upload {pendingCount} File{pendingCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-2"
              >
                <ImageIcon className="h-5 w-5 shrink-0 text-surface-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-surface-200">{item.file.name}</p>
                  <p className="text-xs text-surface-500">{formatBytes(item.file.size)}</p>
                </div>
                {item.status === "done" && <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />}
                {item.status === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {item.error}
                  </span>
                )}
                {item.status === "uploading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-400" />}
                {item.status === "pending" && (
                  <button onClick={() => removeFile(item.id)} className="text-surface-500 hover:text-surface-300">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
