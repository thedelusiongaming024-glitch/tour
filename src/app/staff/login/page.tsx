"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { staffLogin } from "@/lib/staffAuth";

// Only ever redirect to a known, internal staff route after login. The
// `next` query param previously passed straight to router.push() with no
// validation — an attacker could send a staff member a link like
// /staff/login?next=https://evil.example and land them on an external
// site immediately after they authenticate. Restricting to an allowlist
// of real internal destinations closes that off entirely rather than
// trying to pattern-match "looks like a relative path" (which is easy to
// get wrong, e.g. protocol-relative "//evil.example").
const ALLOWED_NEXT_PATHS = new Set(["/staff/dashboard", "/staff/scan"]);
const DEFAULT_NEXT_PATH = "/staff/dashboard";

function resolveNextPath(raw: string | null): string {
  if (raw && ALLOWED_NEXT_PATHS.has(raw)) return raw;
  return DEFAULT_NEXT_PATH;
}

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = resolveNextPath(searchParams.get("next"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await staffLogin(username, password);
    setLoading(false);
    if (result.ok) {
      router.push(next);
    } else {
      setError(result.error);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="text-center text-lg font-semibold text-white">Atithi Staff Login</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Back-office access only.</p>

        <label className="mt-6 flex flex-col gap-1 text-sm text-slate-300">
          Username
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-400"
            autoComplete="username"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm text-slate-300">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-400"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function StaffLoginPage() {
  // useSearchParams requires a Suspense boundary in a Client Component on
  // an otherwise-static route — without one, `next build` fails even
  // though `tsc --noEmit` passes clean (this is a build-time/runtime
  // requirement, not a type error, so type-checking alone never caught
  // it).
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  );
}
