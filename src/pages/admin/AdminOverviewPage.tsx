import { useEffect, useState } from "react";
import { fetchAdminOverview } from "../../api/admin";
import type { AdminOverview } from "../../api/admin";

type LoadState = "idle" | "loading" | "error" | "success";

function MetricCard({
                        label,
                        value,
                        tone = "default",
                    }: {
    label: string;
    value: number;
    tone?: "default" | "danger";
}) {
    const toneClasses =
        tone === "danger"
            ? "border-red-500/40 bg-red-950/40 text-red-200"
            : "border-slate-700 bg-slate-900 text-slate-100";

    return (
        <div className={`rounded-xl border p-4 shadow-sm ${toneClasses}`}>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
    );
}

export default function AdminOverviewPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            setState("loading");
            setError(null);
            const result = await fetchAdminOverview();
            setData(result);
            setState("success");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to load overview");
            setState("error");
        }
    }

    useEffect(() => {
        void load();
    }, []);

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold text-slate-50">
                        Platform overview
                    </h1>
                    <p className="text-sm text-slate-400">
                        Cross-tenant health: tenants, rules, and validation jobs.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
                >
                    Refresh
                </button>
            </div>

            {state === "error" && error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    Failed to load overview: {error}
                </div>
            )}

            {!data && state === "loading" && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                    Loading overview…
                </div>
            )}

            {data && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <MetricCard label="Total tenants" value={data.total_tenants} />
                    <MetricCard
                        label="Tenants with Stripe"
                        value={data.tenants_with_stripe}
                    />
                    <MetricCard label="Total rules" value={data.total_rules} />
                    <MetricCard label="Jobs (last 24h)" value={data.jobs_last_24h} />
                    <MetricCard
                        label="Failed jobs (last 24h)"
                        value={data.jobs_failed_last_24h}
                        tone={data.jobs_failed_last_24h > 0 ? "danger" : "default"}
                    />
                </div>
            )}
        </div>
    );
}
