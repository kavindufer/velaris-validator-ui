import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../api/client";
import type {
    ValidationJob,
    ValidationJobSummary,
    ValidationRule,
} from "../types/api";

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

function getPreviewColumns(
    summary: ValidationJobSummary | null
): string[] | null {
    const rows = summary?.preview_rows;
    if (!rows || rows.length === 0) return null;

    const first = rows[0];
    const keys = Object.keys(first);
    if (keys.length === 0) return null;
    return keys.slice(0, 6);
}

export default function JobDetailPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    const [job, setJob] = useState<ValidationJob | null>(null);
    const [rule, setRule] = useState<ValidationRule | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) return;
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const jobData = await apiGet<ValidationJob>(
                    `/validation-jobs/${encodeURIComponent(jobId)}`
                );

                let ruleData: ValidationRule | null = null;
                try {
                    ruleData = await apiGet<ValidationRule>(
                        `/validation-rules/${encodeURIComponent(
                            jobData.validation_rule_id
                        )}`
                    );
                } catch {
                    ruleData = null;
                }

                if (!cancelled) {
                    setJob(jobData);
                    setRule(ruleData);
                }
            } catch (err) {
                if (!cancelled) {
                    const message =
                        err instanceof Error ? err.message : "Failed to load job";
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
    }, [jobId]);

    const summary = job?.summary ?? null;
    const previewColumns = useMemo(
        () => getPreviewColumns(summary),
        [summary]
    );

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Loading job…
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => navigate("/jobs")}
                    className="text-xs text-sky-300 hover:underline"
                >
                    ← Back to jobs
                </button>

                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    <p className="font-medium">Failed to load job</p>
                    <p className="mt-1 text-xs text-red-200/90">
                        {error ?? "Job not found"}
                    </p>
                </div>
            </div>
        );
    }

    const backingSource = String(
        summary?.backing_source ?? ""
    );

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="text-xs text-sky-300 hover:underline"
            >
                ← Back to jobs
            </button>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-lg font-semibold text-slate-100">
                        Job {job.id}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {rule ? (
                            <>
                                Rule:{" "}
                                <Link
                                    to={`/rules/${encodeURIComponent(rule.id)}`}
                                    className="text-sky-300 hover:underline"
                                >
                                    {rule.name}
                                </Link>
                            </>
                        ) : (
                            <>Rule ID: {job.validation_rule_id}</>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
          <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${backingSourceBadgeClass(
                  backingSource || undefined
              )}`}
          >
            {backingSourceLabel(backingSource || undefined)}
          </span>

                    <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-medium text-slate-100">
            {job.status}
          </span>
                    <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-medium text-slate-100">
            {job.run_type}
          </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Metadata card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Job metadata
                    </h2>
                    <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Job ID</dt>
                            <dd className="font-mono text-slate-200">{job.id}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Status</dt>
                            <dd className="text-slate-200">{job.status}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Run type</dt>
                            <dd className="text-slate-200">{job.run_type}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Created</dt>
                            <dd className="text-slate-200">
                                {formatDate(job.created_at)}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Started</dt>
                            <dd className="text-slate-200">
                                {formatDate(job.started_at)}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Finished</dt>
                            <dd className="text-slate-200">
                                {formatDate(job.finished_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Summary card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Execution summary
                    </h2>
                    {summary ? (
                        <dl className="mt-3 space-y-2 text-xs">
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Source</dt>
                                <dd className="text-slate-200">
                                    {String(summary.source ?? "—")}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Metric</dt>
                                <dd className="text-slate-200">
                                    {String(summary.metric ?? "—")}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Value</dt>
                                <dd className="text-slate-200">
                                    {summary.value !== undefined
                                        ? String(summary.value)
                                        : "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Rows scanned</dt>
                                <dd className="text-slate-200">
                                    {summary.rows_scanned ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Rows matched</dt>
                                <dd className="text-slate-200">
                                    {summary.rows_matched ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-400">Duration (ms)</dt>
                                <dd className="text-slate-200">
                                    {summary.duration_ms ?? "—"}
                                </dd>
                            </div>
                            {summary.stripe_invoice_count !== undefined && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-400">Stripe invoices</dt>
                                    <dd className="text-slate-200">
                                        {summary.stripe_invoice_count}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    ) : (
                        <p className="mt-3 text-xs text-slate-400">
                            No summary available for this job yet.
                        </p>
                    )}
                </div>
            </div>

            {/* Preview rows table */}
            {summary?.preview_rows && summary.preview_rows.length > 0 && previewColumns && (
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Preview rows
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
                        <table className="min-w-full text-left text-xs">
                            <thead className="border-b border-slate-800 bg-slate-900">
                            <tr>
                                {previewColumns.map((column) => (
                                    <th
                                        key={column}
                                        className="px-3 py-2 font-medium uppercase tracking-wide text-slate-400"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {summary.preview_rows.map((row, index) => (
                                <tr
                                    key={index}
                                    className="border-t border-slate-800/60 hover:bg-slate-800/60"
                                >
                                    {previewColumns.map((column) => (
                                        <td key={column} className="px-3 py-2 text-slate-200">
                                            {String(
                                                (row as Record<string, unknown>)[column] ?? ""
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {job.error_message && (
                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
                    <p className="font-semibold">Error message</p>
                    <p className="mt-1 whitespace-pre-wrap">
                        {job.error_message}
                    </p>
                </div>
            )}
        </div>
    );
}
