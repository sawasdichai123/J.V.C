"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Library,
  Upload,
  Settings,
  Search,
  Shield,
  PlusCircle,
} from "lucide-react";

const navItems = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/works/new", label: "New Work", icon: PlusCircle },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-surface-700 bg-surface-900/95 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-surface-700 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-950">
          <Shield className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-mono text-lg font-bold tracking-wider text-brand-400">
            J.V.C
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-surface-500">
            Vault Core
          </p>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/library?focus=search"
          className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-2 text-sm text-surface-500 transition-colors hover:border-surface-600 hover:text-surface-300"
        >
          <Search className="h-4 w-4" />
          <span>Search works...</span>
          <kbd className="ml-auto rounded border border-surface-600 bg-surface-700 px-1.5 py-0.5 font-mono text-[10px] text-surface-400">
            /
          </kbd>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/library" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-950 text-brand-300 border border-brand-500/20"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200 border border-transparent"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-brand-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-700 px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-surface-600">
          Jeetar Vault Core v0.1
        </p>
      </div>
    </aside>
  );
}
