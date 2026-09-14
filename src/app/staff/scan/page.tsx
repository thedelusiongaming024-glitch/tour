"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { clearStaffSession, getStaffUser, staffFetch, type StaffUser } from "@/lib/staffAuth";
import { Icon } from "@/components/Icon";

interface ClearanceBooking {
  booking_reference: string;
  customer_name: string;
  tour_title: string;
  amount_due: string;
  is_cleared: boolean;
}

interface ResolveResponse {
  status: "verified" | "due_pending";
  message: string;
  amount_due?: string;
  booking: ClearanceBooking;
}

type ScanState =
  | { kind: "scanning" }
  | { kind: "resolving" }
  | { kind: "resolved"; data: ResolveResponse; bookingId: string; token: string }
  | { kind: "error"; message: string };

function formatBDT(amount: string | number): string {
  return "৳" + Math.round(Number(amount)).toLocaleString("en-BD");
}

/** Pulls /clearance/{bookingId}?token=... out of a scanned URL, wherever it points. */
function parseClearanceUrl(raw: string): { bookingId: string; token: string } | null {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/clearance\/([^/]+)\/?$/);
    const token = url.searchParams.get("token");
    if (match && token) return { bookingId: match[1], token };
    return null;
  } catch {
    return null;
  }
}

export default function HostScannerPage() {
  const router = useRouter();
  // Previously `useState(() => getStaffUser())` ran sessionStorage.getItem
  // during the initial render — which happens both on the server (no
  // sessionStorage, so this would actually throw/no-op there in a
  // Client Component's first client render) and the client, producing a
  // logged-in user on the client's first paint that the server-rendered
  // HTML never had. React's hydration then mismatches for any signed-in
  // staff member. Reading it in a `useEffect` instead means the first
  // client render matches the server render exactly (both null), and the
  // real value is applied a tick later, after hydration completes.
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const [manualUrl, setManualUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  // Intentional mount-detection reading a client-only store (sessionStorage),
  // not derived state — see the comment above this component's state block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setUser(getStaffUser());
    setAuthChecked(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (authChecked && !user) router.replace("/staff/login?next=/staff/scan");
  }, [authChecked, user, router]);

  const resolveBooking = useCallback(async (bookingId: string, token: string) => {
    setState({ kind: "resolving" });
    try {
      const res = await staffFetch(`/clearance/${bookingId}/?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        setState({ kind: "error", message: "Could not verify this QR code (expired or invalid)." });
        return;
      }
      const data = (await res.json()) as ResolveResponse;
      setState({ kind: "resolved", data, bookingId, token });
    } catch {
      setState({ kind: "error", message: "Network error while verifying." });
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !user || state.kind !== "scanning") return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError("Camera unavailable — use manual entry below instead.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const parsed = parseClearanceUrl(code.data);
        if (parsed) {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          resolveBooking(parsed.bookingId, parsed.token);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [authChecked, user, state.kind, resolveBooking]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseClearanceUrl(manualUrl.trim());
    if (!parsed) {
      setState({ kind: "error", message: "That doesn't look like a valid clearance link." });
      return;
    }
    resolveBooking(parsed.bookingId, parsed.token);
  }

  async function handleClearPayment() {
    if (state.kind !== "resolved") return;
    setState({ kind: "resolving" });
    try {
      // initiate_clearance_payment requires the same signed clearance token
      // as resolve_clearance (it's AllowAny — the token IS the auth, not
      // the staff JWT) — this call was previously sending only `method`,
      // with no token anywhere in the request, so every "Collect payment
      // now" tap failed with 400 "Invalid or missing clearance token."
      // The token was already being parsed off the scanned QR/manual URL
      // in resolveBooking; it just wasn't being kept around in state for
      // this second request to use.
      const res = await staffFetch(`/clearance/${state.bookingId}/pay/`, {
        method: "POST",
        body: JSON.stringify({ method: "host_qr_scan", token: state.token }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.redirect_url) {
        // Host hands the phone/device to the guest to complete payment,
        // or opens it on a shared payment terminal.
        window.location.href = data.redirect_url;
      }
    } catch {
      setState({ kind: "error", message: "Could not start payment. Try scanning again." });
    }
  }

  function reset() {
    setManualUrl("");
    setState({ kind: "scanning" });
  }

  if (!authChecked || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">On-Site Clearance Scanner</h1>
            <p className="text-sm text-slate-400">{user.username} · {user.role}</p>
          </div>
          <button
            onClick={() => {
              clearStaffSession();
              router.push("/staff/login");
            }}
            className="text-sm text-slate-400 underline"
          >
            Sign out
          </button>
        </div>

        {state.kind === "scanning" && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-emerald-400/70" />
            </div>
            {cameraError && <p className="text-sm text-amber-400">{cameraError}</p>}

            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="text-sm text-slate-400">Or paste the clearance link manually</label>
              <div className="flex gap-2">
                <input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://.../clearance/{id}?token=..."
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium hover:bg-emerald-400">
                  Go
                </button>
              </div>
            </form>
          </div>
        )}

        {state.kind === "resolving" && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400/20 border-t-emerald-400" />
            <p className="text-sm text-slate-400">Verifying…</p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <Icon name="shield" className="mx-auto mb-3 h-8 w-8 text-rose-400" />
            <p className="text-sm text-rose-300">{state.message}</p>
            <button onClick={reset} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              Scan again
            </button>
          </div>
        )}

        {state.kind === "resolved" && state.data.status === "verified" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <Icon name="check" className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <h2 className="font-semibold">Confirmed — Fully Paid</h2>
            <p className="mt-2 text-sm text-slate-300">{state.data.booking.tour_title}</p>
            <p className="text-xs font-mono text-slate-500">{state.data.booking.booking_reference}</p>
            <p className="mt-1 text-sm text-slate-300">{state.data.booking.customer_name}</p>
            <button onClick={reset} className="mt-5 w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm hover:bg-white/20">
              Scan next guest
            </button>
          </div>
        )}

        {state.kind === "resolved" && state.data.status === "due_pending" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
            <Icon name="receipt" className="mx-auto mb-3 h-10 w-10 text-amber-400" />
            <h2 className="font-semibold">Balance Due</h2>
            <p className="mt-2 text-sm text-slate-300">{state.data.booking.tour_title}</p>
            <p className="text-xs font-mono text-slate-500">{state.data.booking.booking_reference}</p>
            <p className="mt-1 text-sm text-slate-300">{state.data.booking.customer_name}</p>
            <p className="mt-3 text-2xl font-semibold">{formatBDT(state.data.amount_due ?? state.data.booking.amount_due)}</p>
            <button
              onClick={handleClearPayment}
              className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium hover:bg-emerald-400"
            >
              Collect payment now
            </button>
            <button onClick={reset} className="mt-2 w-full rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
