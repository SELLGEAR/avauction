"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

// Sign in / create account — the minimum biddable loop only. No password
// reset, no OAuth, no email-confirmation flow (Confirm email is OFF in
// Supabase for now — launch-blocking loose end to re-enable before soft
// launch; the no-session signUp branch below is the graceful fallback if
// it's ever on).

// Only same-site relative paths may be redirect targets — absolute URLs,
// protocol-relative //host, and backslash tricks all fall back to the
// auction page. Anything else is an open redirect.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  return "/auction";
}

type Mode = "sign_in" | "sign_up";

function AuthForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setNotice(null);

    let supabase;
    try {
      supabase = createBrowserClient();
    } catch (err) {
      console.error("supabase client unavailable:", err);
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign_in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(
            authError.message === "Invalid login credentials"
              ? "Wrong email or password."
              : authError.message
          );
          return;
        }
        router.replace(next);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
          setError(authError.message);
          return;
        }
        // With Confirm email ON in Supabase, signUp returns a user but no
        // session — say so instead of redirecting to a page that still
        // reads "Sign in to bid".
        if (!data.session) {
          setNotice("Account created — check your email to confirm it, then sign in here.");
          setMode("sign_in");
          return;
        }
        router.replace(next);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isSignIn = mode === "sign_in";

  return (
    <main className="mx-auto max-w-[400px] p-[22px]">
      <Link href="/auction" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← This week&apos;s auction
      </Link>

      <h1 className="mb-1 text-xl font-semibold text-white">
        {isSignIn ? "Sign in" : "Create your account"}
      </h1>
      <p className="mb-6 text-[13px] text-[#666]">
        {isSignIn ? "Welcome back. Bidding requires an account." : "Free account — bid on this week's lots."}
      </p>

      <form onSubmit={submit} className="rounded-xl border border-[#222] bg-[#111] p-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#999]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm normal-case text-white placeholder-[#444] outline-none focus:border-[#3a3a3a]"
          />
        </label>
        <label className="mb-4 mt-3 block text-xs font-medium uppercase tracking-wider text-[#999]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm normal-case text-white placeholder-[#444] outline-none focus:border-[#3a3a3a]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#22ee77] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "One moment…" : isSignIn ? "Sign in" : "Create account"}
        </button>

        {notice && (
          <div
            role="status"
            className="mt-3 rounded-lg border border-[#1a5c38] bg-[#0d2218] px-3 py-2 text-xs text-[#22ee77]"
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-3 py-2 text-xs text-[#ff4444]"
          >
            {error}
          </div>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(isSignIn ? "sign_up" : "sign_in");
          setError(null);
          setNotice(null);
        }}
        className="mt-4 text-xs text-[#4a7aaa] hover:underline"
      >
        {isSignIn ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}

// useSearchParams requires a Suspense boundary for static prerendering.
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
