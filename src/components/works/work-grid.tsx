"use client";

import { Work } from "@/lib/types/database";
import { WorkCard } from "./work-card";

interface WorkGridProps {
  works: Work[];
  onRefresh?: () => void;
}

export function WorkGrid({ works }: WorkGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  );
}
