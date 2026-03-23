"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Save, X, Plus } from "lucide-react";

interface WorkFormProps {
  workId?: string;
}

export function WorkForm({ workId }: WorkFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = !!workId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("tags").select("id, name").order("name"),
    ]);
    setCategories(catRes.data ?? []);
    setTags(tagRes.data ?? []);
  }, [supabase]);

  const fetchWork = useCallback(async () => {
    if (!workId) return;
    const { data: work } = await supabase
      .from("works")
      .select("*, work_tags(tag_id)")
      .eq("id", workId)
      .single();

    if (work) {
      setTitle(work.title);
      setDescription(work.description ?? "");
      setCategoryId(work.category_id ?? "");
      setSelectedTags(
        (work.work_tags as { tag_id: string }[])?.map((wt) => wt.tag_id) ?? []
      );
    }
    setInitialLoading(false);
  }, [supabase, workId]);

  useEffect(() => {
    fetchOptions();
    if (isEdit) fetchWork();
  }, [fetchOptions, fetchWork, isEdit]);

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const { data } = await supabase
      .from("categories")
      .insert({ name: newCategory.trim(), owner_id: (await supabase.auth.getUser()).data.user!.id })
      .select("id, name")
      .single();
    if (data) {
      setCategories((prev) => [...prev, data]);
      setCategoryId(data.id);
      setNewCategory("");
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;
    const { data } = await supabase
      .from("tags")
      .insert({ name: newTag.trim(), owner_id: (await supabase.auth.getUser()).data.user!.id })
      .select("id, name")
      .single();
    if (data) {
      setTags((prev) => [...prev, data]);
      setSelectedTags((prev) => [...prev, data.id]);
      setNewTag("");
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const userId = (await supabase.auth.getUser()).data.user!.id;

      if (isEdit && workId) {
        const { error: updateErr } = await supabase
          .from("works")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            category_id: categoryId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workId);
        if (updateErr) throw updateErr;

        await supabase.from("work_tags").delete().eq("work_id", workId);
        if (selectedTags.length > 0) {
          await supabase.from("work_tags").insert(
            selectedTags.map((tag_id) => ({ work_id: workId, tag_id }))
          );
        }
      } else {
        const { data: newWork, error: insertErr } = await supabase
          .from("works")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            category_id: categoryId || null,
            owner_id: userId,
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;

        if (selectedTags.length > 0 && newWork) {
          await supabase.from("work_tags").insert(
            selectedTags.map((tag_id) => ({ work_id: newWork.id, tag_id }))
          );
        }

        router.push(`/works/${newWork!.id}`);
        return;
      }

      router.push(`/works/${workId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save work");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field text-lg"
          placeholder="My Awesome Work"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field min-h-[100px] resize-y"
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
          Category
        </label>
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-field flex-1"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New..."
              className="input-field w-28"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
            />
            <button type="button" onClick={handleAddCategory} className="btn-secondary px-2">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-surface-400">
          Tags
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={
                selectedTags.includes(tag.id)
                  ? "badge-brand cursor-pointer"
                  : "badge cursor-pointer hover:border-surface-500"
              }
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add new tag..."
            className="input-field w-48"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
          />
          <button type="button" onClick={handleAddTag} className="btn-secondary px-2">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="glow-line" />
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isEdit ? "Update Work" : "Create Work"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
