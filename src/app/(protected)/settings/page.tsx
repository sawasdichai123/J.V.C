"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/types/database";
import { Download, Loader2, User, Save } from "lucide-react";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export default function SettingsPage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null } as ProfileUpdate)
      .eq("id", userId);

    setSaving(false);
    setMessage(error ? error.message : "Profile saved!");
  }

  async function handleExport() {
    setExporting(true);
    setMessage(null);

    try {
      const [worksRes, catsRes, tagsRes, workTagsRes, assetsRes] = await Promise.all([
        supabase.from("works").select("*").eq("is_deleted", false),
        supabase.from("categories").select("*"),
        supabase.from("tags").select("*"),
        supabase.from("work_tags").select("*"),
        supabase.from("assets").select("*"),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        version: "1.0",
        works: worksRes.data ?? [],
        categories: catsRes.data ?? [],
        tags: tagsRes.data ?? [],
        work_tags: workTagsRes.data ?? [],
        assets: assetsRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jvc-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage("Export downloaded successfully!");
    } catch {
      setMessage("Export failed. Please try again.");
    }

    setExporting(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Settings</h1>
        <p className="mt-1 text-sm text-surface-400">
          Manage your profile and backup
        </p>
      </div>

      <div className="glow-line" />

      {/* Profile */}
      <div className="card mx-auto max-w-2xl p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-200">
          <User className="h-5 w-5 text-brand-400" />
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Profile
          </button>
        </form>
      </div>

      {/* Export / Backup */}
      <div className="card mx-auto max-w-2xl p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-200">
          <Download className="h-5 w-5 text-brand-400" />
          Export Metadata (Backup)
        </h2>
        <p className="mb-4 text-sm text-surface-400">
          Download a JSON file containing all your works, categories, tags, and
          asset references. This can be used to restore or migrate your vault
          data.
        </p>
        <button
          onClick={handleExport}
          className="btn-primary"
          disabled={exporting}
        >
          {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Download className="h-4 w-4" />
          Export All Metadata
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div className="mx-auto max-w-2xl">
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.includes("failed") || message.includes("error")
                ? "border-red-500/30 bg-red-950 text-red-300"
                : "border-brand-500/30 bg-brand-950 text-brand-300"
            }`}
          >
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
