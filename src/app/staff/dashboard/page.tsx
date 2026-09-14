"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStaffSession, getStaffUser, staffFetch, type StaffUser } from "@/lib/staffAuth";

interface AgencyOverview {
  total_revenue: string;
  total_direct_cost: string;
  total_operational_expense: string;
  gross_profit: string;
  net_profit: string;
  bookings_count: number;
  active_tours_count: number;
  pending_advances: string;
  due_on_tour_day: string;
  supplier_payables: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

function formatBDT(amount: string | number): string {
  return "৳" + Math.round(Number(amount)).toLocaleString("en-BD");
}

function KpiCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "negative" }) {
  const toneClass =
    tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

const SEVERITY_STYLES: Record<Alert["severity"], string> = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export default function StaffDashboardPage() {
  const router = useRouter();
  // See the identical comment in staff/scan/page.tsx: reading
  // sessionStorage inside useState's initializer produced a client-vs-
  // server hydration mismatch for any signed-in staff member. Deferred to
  // a mount effect instead, so the first client render matches the
  // server render (both null).
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [overview, setOverview] = useState<AgencyOverview | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Intentional mount-detection reading a client-only store (sessionStorage),
  // not derived state — see the comment above this component's state block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setUser(getStaffUser());
    setAuthChecked(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      router.replace("/staff/login?next=/staff/dashboard");
      return;
    }

    async function load() {
      try {
        const [overviewRes, alertsRes] = await Promise.all([
          staffFetch("/finance/overview/"),
          staffFetch("/alerts/?is_acknowledged=false"),
        ]);

        if (overviewRes.status === 403) {
          setError("Your role doesn't have access to financial data. Contact a Finance Manager or Super Admin.");
        } else if (overviewRes.ok) {
          setOverview(await overviewRes.json());
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data.results ?? data);
        }
      } catch {
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authChecked, user, router]);

  async function acknowledgeAlert(id: string) {
    // The feed is fetched with `is_acknowledged=false`, so an acknowledged
    // alert belongs out of the list, not just flagged within it. This
    // previously only patched the item's `is_acknowledged` field in place —
    // the card stayed on screen with its "Acknowledge" button still live,
    // letting staff click it repeatedly, and the "Alerts (N)" count never
    // went down. Remove it optimistically, and put it back if the PATCH
    // fails so a real failure isn't silently swallowed.
    const previous = alerts;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const res = await staffFetch(`/alerts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_acknowledged: true }),
    });
    if (!res.ok) setAlerts(previous);
  }

  if (!authChecked || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Management Dashboard</h1>
            <p className="text-sm text-slate-400">{user.username} · {user.role}</p>
          </div>
          <div className="flex gap-3">
            <a href="/staff/scan" className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              QR Scanner
            </a>
            <button
              onClick={() => {
                clearStaffSession();
                router.push("/staff/login");
              }}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>

        {loading && <p className="text-slate-400">Loading dashboard…</p>}
        {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{error}</p>}

        {overview && (
          <>
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
                Profit Dashboard
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="Revenue" value={formatBDT(overview.total_revenue)} />
                <KpiCard label="Direct Costs" value={formatBDT(overview.total_direct_cost)} />
                <KpiCard label="Gross Profit" value={formatBDT(overview.gross_profit)} tone="positive" />
                <KpiCard label="Operational Expense" value={formatBDT(overview.total_operational_expense)} />
                <KpiCard
                  label="Net Profit"
                  value={formatBDT(overview.net_profit)}
                  tone={Number(overview.net_profit) >= 0 ? "positive" : "negative"}
                />
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
                Receivables &amp; Payables
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <KpiCard label="Bookings" value={String(overview.bookings_count)} />
                <KpiCard label="Active Tours" value={String(overview.active_tours_count)} />
                <KpiCard label="Pending Advances" value={formatBDT(overview.pending_advances)} tone="negative" />
                <KpiCard label="Due On Tour Day" value={formatBDT(overview.due_on_tour_day)} tone="negative" />
              </div>
            </section>
          </>
        )}

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
            Alerts ({alerts.length})
          </h2>
          {alerts.length === 0 && !loading && (
            <p className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
              No open alerts. Run <code className="rounded bg-black/40 px-1">python manage.py generate_alerts</code> to refresh.
            </p>
          )}
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between rounded-xl border p-4 text-sm ${SEVERITY_STYLES[alert.severity]}`}
              >
                <span>{alert.message}</span>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="ml-4 shrink-0 rounded-lg bg-black/20 px-3 py-1.5 text-xs hover:bg-black/30"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
