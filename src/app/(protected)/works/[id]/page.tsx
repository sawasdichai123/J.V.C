"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Work, Asset } from "@/lib/types/database";
import { WorkForm } from "@/components/works/work-form";
import { formatDate, formatBytes } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  Trash2,
  Edit3,
  Upload,
  ImageIcon,
  ArrowLeft,
  Tag,
  Download,
} from "lucide-react";
import Link from "next/link";

export default function WorkDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const router = useRouter();

  const [work, setWork] = useState<Work | null>(null);
  const [assets, setAssets] = useState<(Asset & { signedUrl?: string })[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchWork = useCallback(async () => {
    const { data } = await supabase
      .from("works")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single();
    setWork(data as Work | null);
  }, [supabase, id]);

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("work_id", id)
      .eq("kind", "original")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const withUrls = await Promise.all(
        data.map(async (asset) => {
          const { data: urlData } = await supabase.storage
            .from(asset.bucket)
            .createSignedUrl(asset.path, 3600);
          return { ...asset, signedUrl: urlData?.signedUrl };
        })
      );
      setAssets(withUrls);
    } else {
      setAssets([]);
    }
  }, [supabase, id]);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase
      .from("work_tags")
      .select("tag:tags(id, name)")
      .eq("work_id", id);
    setTags(
      (data ?? []).map((d: { tag: { id: string; name: string } | null }) => d.tag).filter(Boolean) as {
        id: string;
        name: string;
      }[]
    );
  }, [supabase, id]);

  useEffect(() => {
    Promise.all([fetchWork(), fetchAssets(), fetchTags()]).finally(() =>
      setLoading(false)
    );
  }, [fetchWork, fetchAssets, fetchTags]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this work?")) return;
    setDeleting(true);
    await supabase
      .from("works")
      .update({ is_deleted: true })
      .eq("id", id);
    router.push("/library");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-surface-300">Work not found</h2>
        <Link href="/library" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-surface-100">Edit Work</h1>
          <button onClick={() => setEditMode(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
        <div className="glow-line" />
        <WorkForm workId={id} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/library" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Library
        </Link>
        <div className="flex gap-2">
          <Link href={`/upload?workId=${id}`} className="btn-primary">
            <Upload className="h-4 w-4" />
            Upload Images
          </Link>
          <button onClick={() => setEditMode(true)} className="btn-secondary">
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      <div className="glow-line" />

      {/* Work info */}
      <div className="card p-6">
        <h1 className="text-3xl font-bold text-surface-50">{work.title}</h1>
        {work.description && (
          <p className="mt-2 text-surface-400">{work.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {work.category && (
            <span className="badge-brand">
              <Tag className="mr-1 h-3 w-3" />
              {work.category.name}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.id} className="badge">
              {tag.name}
            </span>
          ))}
          <span className="text-xs text-surface-500">
            Created {formatDate(work.created_at)}
          </span>
        </div>
      </div>

      {/* Images */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-200">
          Images ({assets.length})
        </h2>

        {assets.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="mb-3 h-12 w-12 text-surface-600" />
            <p className="text-surface-400">No images uploaded yet</p>
            <Link href={`/upload?workId=${id}`} className="btn-primary mt-4">
              <Upload className="h-4 w-4" />
              Upload Images
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {assets.map((asset) => (
              <div key={asset.id} className="card-hover group overflow-hidden">
                <div className="relative aspect-square overflow-hidden bg-surface-800">
                  {asset.signedUrl ? (
                    <img
                      src={asset.signedUrl}
                      alt={asset.path}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-surface-600" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="truncate text-xs text-surface-500">
                    {asset.bytes ? formatBytes(asset.bytes) : "—"}
                  </span>
                  {asset.signedUrl && (
                    <a
                      href={asset.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surface-500 hover:text-brand-400 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
