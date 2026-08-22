"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

// Session chip for page headers: "Sign in" link when signed out, email +
// sign-out when signed in. Guarded like BidPanel: a Supabase client that
// can't init (missing NEXT_PUBLIC_ env var) must render signed-out, not
// crash the page.
export function AuthStatus() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let supabase;
    try {
      supabase = createBrowserClient();
    } catch (e) {
      console.error("supabase client unavailable, rendering signed-out:", e);
      setChecked(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Reserve the row height while the session check runs so the header
  // doesn't jump when the chip appears.
  if (!checked) return <div className="h-7" aria-hidden />;

  if (!email) {
    return (
      <Link
        href={`/auth?next=${encodeURIComponent(pathname || "/auction")}`}
        className="inline-block rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#999] transition-colors hover:border-[#3a3a3a] hover:text-white"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="max-w-[180px] truncate text-[#888]" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => {
          try {
            void createBrowserClient().auth.signOut();
          } catch (e) {
            console.error("sign-out failed:", e);
          }
        }}
        className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 font-medium text-[#999] transition-colors hover:border-[#3a3a3a] hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
