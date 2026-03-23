"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Work } from "@/lib/types/database";
import { WorkGrid } from "@/components/works/work-grid";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LibraryPage() {
  const supabase = createClient();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("works")
      .select("*, category:categories(*)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (query.trim()) {
      q = q.ilike("title", `%${query.trim()}%`);
    }
    if (categoryFilter) {
      q = q.eq("category_id", categoryFilter);
    }

    const { data } = await q;
    setWorks((data as Work[]) ?? []);
    setLoading(false);
  }, [supabase, query, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    setCategories(data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorks();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchWorks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Library</h1>
          <p className="mt-1 text-sm text-surface-400">
            {works.length} work{works.length !== 1 ? "s" : ""} in your vault
          </p>
        </div>
        <Link href="/works/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New Work
        </Link>
      </div>

      <div className="glow-line" />

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search works by title..."
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field appearance-none pl-10 pr-8"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : works.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800">
            <Search className="h-8 w-8 text-surface-500" />
          </div>
          <h3 className="text-lg font-medium text-surface-300">
            {query ? "No works found" : "Your vault is empty"}
          </h3>
          <p className="mt-1 text-sm text-surface-500">
            {query
              ? "Try a different search term"
              : "Create your first work to get started"}
          </p>
          {!query && (
            <Link href="/works/new" className="btn-primary mt-4">
              <Plus className="h-4 w-4" />
              Create First Work
            </Link>
          )}
        </div>
      ) : (
        <WorkGrid works={works} onRefresh={fetchWorks} />
      )}
    </div>
  );
}
