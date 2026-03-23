"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b border-surface-700 bg-surface-900/80 px-6 backdrop-blur-md">
      {email && (
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{email}</span>
        </div>
      )}
      <button onClick={handleLogout} className="btn-ghost px-3 py-1.5 text-xs">
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </button>
    </header>
  );
}
