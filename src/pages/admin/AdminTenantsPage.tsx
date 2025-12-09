import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminTenants } from "../../api/admin";
import type { AdminTenantRow } from "../../api/admin";

type LoadState = "idle" | "loading" | "error" | "success";

function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function AdminTenantsPage() {
    const [rows, setRows] = useState<AdminTenantRow[]>([]);
    const [search, setSearch] = useState("");
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    async function load() {
        try {
            setState("loading");
            setError(null);
            const result = await fetchAdminTenants();
            setRows(result);
            setState("success");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to load tenants");
            setState("error");
        }
    }

    useEffect(() => {
        void load();
    }, []);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (row) =>
                row.name.toLowerCase().includes(q) ||
                row.id.toLowerCase().includes(q),
        );
    }, [rows, search]);

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-50">Tenants</h1>
                    <p className="text-sm text-slate-400">
                        All tenants with quick health signals for Stripe and Velaris
                        connections.
                    </p>
                </div>
                <input
                    type="search"
                    placeholder="Search by name or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>

            {state === "error" && error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    Failed to load tenants: {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-3 py-2 text-left">Tenant name</th>
                        <th className="px-3 py-2 text-left">Tenant ID</th>
                        <th className="px-3 py-2 text-left">Stripe</th>
                        <th className="px-3 py-2 text-left">Velaris</th>
                        <th className="px-3 py-2 text-right">Jobs (24h)</th>
                        <th className="px-3 py-2 text-right">Failed (24h)</th>
                        <th className="px-3 py-2 text-left">Latest job</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {filteredRows.map((row) => (
                        <tr
                            key={row.id}
                            className="cursor-pointer hover:bg-slate-900"
                            onClick={() =>
                                navigate(`/admin/tenants/${encodeURIComponent(row.id)}`)
                            }
                        >
                            <td className="px-3 py-2 text-slate-100">{row.name}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">
                                {row.id}
                            </td>
                            <td className="px-3 py-2">
                  <span
                      className={classNames(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.has_stripe
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/60"
                              : "bg-slate-900 text-slate-400 border border-slate-700/60",
                      )}
                  >
                    {row.has_stripe ? "Connected" : "Not connected"}
                  </span>
                            </td>
                            <td className="px-3 py-2">
                  <span
                      className={classNames(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.has_velaris
                              ? "bg-sky-950/60 text-sky-300 border border-sky-700/60"
                              : "bg-slate-900 text-slate-400 border border-slate-700/60",
                      )}
                  >
                    {row.has_velaris ? "Connected" : "Not connected"}
                  </span>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-100">
                                {row.jobs_last_24h}
                            </td>
                            <td
                                className={classNames(
                                    "px-3 py-2 text-right",
                                    row.jobs_failed_last_24h > 0
                                        ? "text-red-300"
                                        : "text-slate-200",
                                )}
                            >
                                {row.jobs_failed_last_24h}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-400">
                                {row.latest_job_created_at
                                    ? new Date(row.latest_job_created_at).toLocaleString()
                                    : "—"}
                            </td>
                        </tr>
                    ))}

                    {filteredRows.length === 0 && state === "success" && (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-3 py-6 text-center text-sm text-slate-400"
                            >
                                No tenants match this filter.
                            </td>
                        </tr>
                    )}

                    {state === "loading" && (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-3 py-6 text-center text-sm text-slate-400"
                            >
                                Loading tenants…
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
