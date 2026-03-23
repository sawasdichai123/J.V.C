"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dropzone } from "@/components/upload/dropzone";
import { Loader2 } from "lucide-react";

export default function UploadPage() {
  const searchParams = useSearchParams();
  const preselectedWorkId = searchParams.get("workId");
  const supabase = createClient();

  const [works, setWorks] = useState<{ id: string; title: string }[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState(preselectedWorkId ?? "");
  const [loading, setLoading] = useState(true);

  const fetchWorks = useCallback(async () => {
    const { data } = await supabase
      .from("works")
      .select("id, title")
      .eq("is_deleted", false)
      .order("title");
    setWorks(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Upload Images</h1>
        <p className="mt-1 text-sm text-surface-400">
          Upload images to a work in your vault
        </p>
      </div>

      <div className="glow-line" />

      {/* Work selector */}
      <div className="mx-auto max-w-2xl">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
          Select Work *
        </label>
        <select
          value={selectedWorkId}
          onChange={(e) => setSelectedWorkId(e.target.value)}
          className="input-field"
        >
          <option value="">Choose a work...</option>
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      {selectedWorkId ? (
        <div className="mx-auto max-w-2xl">
          <Dropzone workId={selectedWorkId} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-surface-400">Select a work above to start uploading</p>
        </div>
      )}
    </div>
  );
}
