// src/pages/JobsListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ValidationJob, ValidationRule } from "../types/api";
import { apiGet } from "../api/client";
import {
    archiveJob,
    fetchActiveJobs,
    fetchArchivedJobs,
    restoreJob,
} from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import { canArchiveEntities } from "../utils/permissions";

type StatusFilter = "all" | "pending" | "running" | "success" | "failed";
type JobsTab = "active" | "archived";

function formatDate(value: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function backingSourceLabel(backingSource: string | undefined): string {
    if (backingSource === "stripe_live") return "Stripe live data";
    if (backingSource === "sample_data") return "Sample data";
    if (!backingSource) return "Unknown";
    return backingSource;
}

function backingSourceBadgeClass(backingSource: string | undefined): string {
    if (backingSource === "stripe_live") {
        return "border-emerald-500/60 bg-emerald-900/40 text-emerald-100";
    }
    if (backingSource === "sample_data") {
        return "border-sky-500/60 bg-sky-900/40 text-sky-100";
    }
    return "border-slate-500/60 bg-slate-900/60 text-slate-100";
}

function statusChipClass(status: string): string {
    switch (status) {
        case "success":
            return "border-emerald-500/50 bg-emerald-900/40 text-emerald-100";
        case "failed":
            return "border-red-500/50 bg-red-900/40 text-red-100";
        case "running":
            return "border-sky-500/50 bg-sky-900/40 text-sky-100";
        case "pending":
            return "border-amber-500/50 bg-amber-900/40 text-amber-100";
        default:
            return "border-slate-500/50 bg-slate-900/40 text-slate-100";
    }
}

export default function JobsListPage() {
    const { user } = useAuth();
    const canArchive = canArchiveEntities(user);

    const [tab, setTab] = useState<JobsTab>("active");

    const [jobs, setJobs] = useState<ValidationJob[]>([]);
    const [archivedJobs, setArchivedJobs] = useState<ValidationJob[]>([]);
    const [rulesById, setRulesById] = useState<Record<string, ValidationRule>>({});

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState<string>("");

    const [actionError, setActionError] = useState<string | null>(null);
    const [actionBusyId, setActionBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [jobsData, rulesData] = await Promise.all([
                    tab === "active" ? fetchActiveJobs() : fetchArchivedJobs(),
                    apiGet<ValidationRule[]>("/validation-rules"),
                ]);

                if (!cancelled) {
                    const map: Record<string, ValidationRule> = {};
                    for (const rule of rulesData) {
                        map[rule.id] = rule;
                    }
                    setRulesById(map);

                    if (tab === "active") {
                        setJobs(jobsData);
                    } else {
                        setArchivedJobs(jobsData);
                    }
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
    }, [tab]);

    const jobsForTab = tab === "active" ? jobs : archivedJobs;

    const filteredJobs = useMemo(() => {
        return jobsForTab.filter((job) => {
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
    }, [jobsForTab, statusFilter, rulesById, search]);

    const hasJobs = filteredJobs.length > 0;
    const totalColumns = canArchive ? 9 : 8;

    const handleArchiveJob = async (jobId: string) => {
        try {
            setActionError(null);
            setActionBusyId(jobId);
            const updated = await archiveJob(jobId);

            setJobs((prev) => prev.filter((j) => j.id !== jobId));
            setArchivedJobs((prev) => [...prev, updated]);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to archive job";
            setActionError(message);
        } finally {
            setActionBusyId(null);
        }
    };

    const handleRestoreJob = async (jobId: string) => {
        try {
            setActionError(null);
            setActionBusyId(jobId);
            const updated = await restoreJob(jobId);

            setArchivedJobs((prev) => prev.filter((j) => j.id !== jobId));
            setJobs((prev) => [...prev, updated]);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to restore job";
            setActionError(message);
        } finally {
            setActionBusyId(null);
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
                <div className="text-sm text-slate-300">
                    There was a problem loading jobs.
                </div>
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
                <h1 className="text-lg font-semibold text-slate-100">
                    Validation jobs
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Active jobs are loaded from{" "}
                    <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                        GET /validation-jobs
                    </code>
                    . Archived jobs use{" "}
                    <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                        GET /validation-jobs/archived
                    </code>
                    .
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-0.5 text-xs">
                    <button
                        type="button"
                        onClick={() => setTab("active")}
                        className={`rounded px-3 py-1 ${
                            tab === "active"
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-400 hover:text-slate-100"
                        }`}
                    >
                        Active
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("archived")}
                        className={`rounded px-3 py-1 ${
                            tab === "archived"
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-400 hover:text-slate-100"
                        }`}
                    >
                        Archived
                    </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
            </div>

            {actionError && (
                <p className="text-xs text-red-400">{actionError}</p>
            )}

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
                            Data source
                        </th>
                        <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Value
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
                        {canArchive && (
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Actions
                            </th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {hasJobs ? (
                        filteredJobs.map((job) => {
                            const rule = rulesById[job.validation_rule_id];
                            const backingSource = job.summary
                                ?.backing_source as string | undefined;
                            const value =
                                job.summary && job.summary.value !== undefined
                                    ? String(job.summary.value)
                                    : "—";
                            const busy = actionBusyId === job.id;

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
                                                to={`/rules/${encodeURIComponent(
                                                    rule.id,
                                                )}`}
                                                className="text-sky-300 hover:underline"
                                            >
                                                {rule.name}
                                            </Link>
                                        ) : (
                                            <span className="text-slate-500">
                                                    {job.validation_rule_id}
                                                </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${backingSourceBadgeClass(
                                                    backingSource,
                                                )}`}
                                            >
                                                {backingSourceLabel(backingSource)}
                                            </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-200">
                                        {value}
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusChipClass(
                                                    job.status,
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
                                    {canArchive && (
                                        <td className="px-4 py-2 text-xs text-right">
                                            {job.archived_at && (
                                                <div className="mb-1 text-[11px] text-slate-500">
                                                    Archived{" "}
                                                    {formatDate(job.archived_at)}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    tab === "archived"
                                                        ? handleRestoreJob(job.id)
                                                        : handleArchiveJob(job.id)
                                                }
                                                className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                                                    tab === "archived"
                                                        ? "border-emerald-500/60 text-emerald-100 hover:bg-emerald-900/40"
                                                        : "border-amber-500/60 text-amber-100 hover:bg-amber-900/40"
                                                } disabled:opacity-60`}
                                            >
                                                {busy
                                                    ? tab === "archived"
                                                        ? "Restoring…"
                                                        : "Archiving…"
                                                    : tab === "archived"
                                                        ? "Restore"
                                                        : "Archive"}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={totalColumns}
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
