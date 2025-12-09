import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api/client";
import type { ValidationJob, ValidationRule } from "../types/api";

type StatusFilter = "all" | "pending" | "running" | "success" | "failed";

export default function JobsListPage() {
    const [jobs, setJobs] = useState<ValidationJob[]>([]);
    const [rulesById, setRulesById] = useState<Record<string, ValidationRule>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [jobsData, rulesData] = await Promise.all([
                    apiGet<ValidationJob[]>("/validation-jobs?limit=50&offset=0"),
                    apiGet<ValidationRule[]>("/validation-rules"),
                ]);

                if (!cancelled) {
                    setJobs(jobsData);
                    const map: Record<string, ValidationRule> = {};
                    for (const rule of rulesData) {
                        map[rule.id] = rule;
                    }
                    setRulesById(map);
                }
            } catch (err) {
                if (!cancelled) {
                    const message =
                        err instanceof Error ? err.message : "Failed to load jobs";
                    setError(message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            if (statusFilter !== "all" && job.status !== statusFilter) {
                return false;
            }
            if (!search) return true;

            const rule = rulesById[job.validation_rule_id];
            const ruleName = rule?.name ?? "";
            const term = search.toLowerCase();

            return (
                job.id.toLowerCase().includes(term) ||
                ruleName.toLowerCase().includes(term)
            );
        });
    }, [jobs, rulesById, search, statusFilter]);

    const formatDate = (value: string | null): string => {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    const statusChipClass = (status: string): string => {
        switch (status) {
            case "success":
                return "border-emerald-500/50 bg-emerald-900/40 text-emerald-100";
            case "failed":
                return "border-red-500/50 bg-red-900/40 text-red-100";
            case "running":
                return "border-sky-500/50 bg-sky-900/40 text-sky-100";
            case "pending":
                return "border-slate-500/60 bg-slate-900/60 text-slate-100";
            default:
                return "border-slate-600 bg-slate-900 text-slate-100";
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Loading jobs…
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3">
                <h1 className="text-lg font-semibold text-slate-100">Jobs</h1>
                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    <p className="font-medium">Failed to load jobs</p>
                    <p className="mt-1 text-xs text-red-200/90">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold text-slate-100">Validation jobs</h1>
                <p className="mt-1 text-sm text-slate-400">
                    Loaded from{" "}
                    <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                        GET /validation-jobs?limit=50&amp;offset=0
                    </code>
                    .
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="status-filter" className="text-slate-400">
                        Status
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as StatusFilter)
                        }
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                    >
                        <option value="all">All</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="running">Running</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Filter by job ID or rule name…"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 sm:w-72"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-800/80 bg-slate-900">
                    <tr>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Job ID
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Rule
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Status
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Run type
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Created
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Finished
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredJobs.map((job) => {
                        const rule = rulesById[job.validation_rule_id];
                        return (
                            <tr
                                key={job.id}
                                className="border-t border-slate-800/60 hover:bg-slate-800/60"
                            >
                                <td className="px-4 py-2 font-mono text-xs text-sky-300">
                                    <Link
                                        to={`/jobs/${encodeURIComponent(job.id)}`}
                                        className="hover:underline"
                                    >
                                        {job.id}
                                    </Link>
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-200">
                                    {rule ? (
                                        <Link
                                            to={`/rules/${encodeURIComponent(rule.id)}`}
                                            className="hover:underline"
                                        >
                                            {rule.name}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-500">
                        {job.validation_rule_id}
                      </span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                    <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusChipClass(
                            job.status
                        )}`}
                    >
                      {job.status}
                    </span>
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-200">
                                    {job.run_type}
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-300">
                                    {formatDate(job.created_at)}
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-300">
                                    {formatDate(job.finished_at)}
                                </td>
                            </tr>
                        );
                    })}

                    {filteredJobs.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-4 py-6 text-center text-xs text-slate-400"
                            >
                                No jobs match the current filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
