"use client";

import Link from "next/link";
import { Work } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { ImageIcon, Tag } from "lucide-react";

interface WorkCardProps {
  work: Work;
}

export function WorkCard({ work }: WorkCardProps) {
  return (
    <Link href={`/works/${work.id}`}>
      <div className="card-hover group overflow-hidden">
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden bg-surface-800">
          {work.cover_url ? (
            <img
              src={work.cover_url}
              alt={work.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-surface-600" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface-900/90 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="truncate text-sm font-semibold text-surface-100 group-hover:text-brand-300 transition-colors">
            {work.title}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            {work.category && (
              <span className="badge-brand">
                <Tag className="mr-1 h-3 w-3" />
                {work.category.name}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-surface-500">
            {formatDate(work.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}
