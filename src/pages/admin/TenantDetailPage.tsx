import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchTenantOverview } from "../../api/admin";
import type { TenantOverview } from "../../api/admin";

type LoadState = "idle" | "loading" | "error" | "success";

export default function TenantDetailPage() {
    const { tenantId } = useParams<"tenantId">();
    const [data, setData] = useState<TenantOverview | null>(null);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    async function load(id: string) {
        try {
            setState("loading");
            setError(null);
            const result = await fetchTenantOverview(id);
            setData(result);
            setState("success");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to load tenant");
            setState("error");
        }
    }

    useEffect(() => {
        if (tenantId) {
            void load(tenantId);
        }
    }, [tenantId]);

    if (!tenantId) {
        return (
            <div className="p-6 text-sm text-red-300">
                No tenant ID in route. This should not happen.
            </div>
        );
    }

    const tenant = data?.tenant;

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="mb-1 text-xs text-slate-500">
                        <Link
                            to="/admin/tenants"
                            className="text-sky-400 hover:underline"
                        >
                            ← Back to tenants
                        </Link>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-50">
                        {tenant?.name ?? "Tenant details"}
                    </h1>
                    <p className="font-mono text-sm text-slate-400">
                        {tenant?.id ?? tenantId}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span
                className={
                    tenant?.has_stripe
                        ? "inline-flex items-center rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2 py-0.5 text-emerald-200"
                        : "inline-flex items-center rounded-full border border-slate-700/50 bg-slate-900 px-2 py-0.5 text-slate-300"
                }
            >
              Stripe: {tenant?.has_stripe ? "Connected" : "Not connected"}
            </span>
                        <span
                            className={
                                tenant?.has_velaris
                                    ? "inline-flex items-center rounded-full border border-sky-700/50 bg-sky-950/60 px-2 py-0.5 text-sky-200"
                                    : "inline-flex items-center rounded-full border border-slate-700/50 bg-slate-900 px-2 py-0.5 text-slate-300"
                            }
                        >
              Velaris: {tenant?.has_velaris ? "Connected" : "Not connected"}
            </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void load(tenantId)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
                >
                    Refresh
                </button>
            </div>

            {state === "error" && error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    Failed to load tenant: {error}
                </div>
            )}

            {!data && state === "loading" && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                    Loading tenant overview…
                </div>
            )}

            {data && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    {/* Metrics card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <h2 className="text-sm font-semibold text-slate-100">
                            Metrics (last 24h)
                        </h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Rules</dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.rules_count}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Jobs total</dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.jobs_total}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Jobs (last 24h)</dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.jobs_last_24h}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Failed (last 24h)</dt>
                                <dd
                                    className={
                                        data.jobs_failed_last_24h > 0
                                            ? "font-semibold text-red-300"
                                            : "font-semibold text-slate-100"
                                    }
                                >
                                    {data.jobs_failed_last_24h}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Recent jobs */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-100">
                                Recent jobs
                            </h2>
                            <span className="text-xs text-slate-500">
                Showing up to {data.latest_jobs.length} jobs
              </span>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 text-left">Job ID</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Run type</th>
                                    <th className="px-3 py-2 text-left">Created at</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {data.latest_jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td className="px-3 py-2 font-mono text-xs text-sky-300">
                                            <Link
                                                to={`/jobs/${encodeURIComponent(job.id)}`}
                                                className="hover:underline"
                                            >
                                                {job.id}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">
                        <span
                            className={
                                job.status === "failed"
                                    ? "inline-flex rounded-full border border-red-600/60 bg-red-950/60 px-2 py-0.5 text-xs font-medium text-red-200"
                                    : "inline-flex rounded-full border border-emerald-600/60 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-200"
                            }
                        >
                          {job.status}
                        </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-200">
                                            {job.run_type}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-400">
                                            {new Date(job.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {data.latest_jobs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-3 py-6 text-center text-sm text-slate-400"
                                        >
                                            No recent jobs for this tenant.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
