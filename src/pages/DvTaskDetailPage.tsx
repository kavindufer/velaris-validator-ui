import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DvTaskDetail } from "../types/api";
import { fetchDvTask, runDvTask } from "../api/dvTasks";
import { ApiError } from "../api/client";

export default function DvTaskDetailPage() {
    const { taskId } = useParams<{ taskId: string }>();

    const [detail, setDetail] = useState<DvTaskDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [running, setRunning] = useState<boolean>(false);
    const [runError, setRunError] = useState<string | null>(null);
    const [runMessage, setRunMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!taskId) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await fetchDvTask(taskId);
                if (cancelled) return;
                setDetail(resp);
            } catch (err) {
                console.error("Failed to load DV task", err);
                if (err instanceof ApiError && err.status === 404) {
                    setError("DV Task not found.");
                } else if (err instanceof ApiError) {
                    setError(
                        `Failed to load DV task (${err.status}): ${err.message}`,
                    );
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load DV task.");
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
    }, [taskId]);

    const handleRunNow = async () => {
        if (!taskId) return;
        setRunError(null);
        setRunMessage(null);
        setRunning(true);
        try {
            const resp = await runDvTask(taskId);
            const count = resp.job_ids.length;
            setRunMessage(
                `Queued ${count} job${count === 1 ? "" : "s"} for this DV Task.`,
            );
        } catch (err) {
            console.error("Failed to run DV task", err);
            if (err instanceof ApiError) {
                setRunError(
                    `Failed to run DV Task (${err.status}): ${err.message}`,
                );
            } else if (err instanceof Error) {
                setRunError(err.message);
            } else {
                setRunError("Failed to run DV Task.");
            }
        } finally {
            setRunning(false);
        }
    };

    if (!taskId) {
        return (
            <div className="text-sm text-rose-200">
                Missing task id in URL.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-sm text-slate-300">Loading DV Task…</div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-rose-500/70 bg-rose-950/60 px-4 py-3 text-sm text-rose-100">
                {error}
            </div>
        );
    }

    if (!detail) {
        return null;
    }

    const { task, rules } = detail;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <Link
                        to="/dv-tasks"
                        className="text-xs font-medium uppercase tracking-wide text-sky-300 hover:text-sky-200"
                    >
                        ← Back to DV Tasks
                    </Link>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-50">
                        {task.name}
                    </h1>
                    {task.description && (
                        <p className="mt-1 text-sm text-slate-400">
                            {task.description}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <button
                        type="button"
                        disabled={running}
                        onClick={handleRunNow}
                        className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-50 shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {running ? "Running…" : "Run task now"}
                    </button>
                    {runMessage && (
                        <div className="text-xs text-emerald-300">
                            {runMessage}
                        </div>
                    )}
                    {runError && (
                        <div className="text-xs text-rose-300">
                            {runError}
                        </div>
                    )}
                </div>
            </div>

            {/* Task metadata */}
            <div className="grid gap-4 rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-4 text-sm text-slate-100 md:grid-cols-2">
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Source
                    </div>
                    <div className="mt-1">
                        Stripe <span className="font-mono">{task.source_resource}</span>
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Target object
                    </div>
                    <div className="mt-1">{task.target_velaris_object}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Dedupe key
                    </div>
                    <div className="mt-1">{task.dedupe_key}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Join helper
                    </div>
                    {task.join_hint ? (
                        <div className="mt-1 space-y-0.5">
                            <div>
                                <span className="text-xs text-slate-400">
                                    Velaris field:
                                </span>{" "}
                                <span className="font-mono text-slate-100">
                                    {task.join_hint.velaris_field}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">
                                    Stripe field:
                                </span>{" "}
                                <span className="font-mono text-slate-100">
                                    {task.join_hint.source_field}
                                </span>
                            </div>
                            {task.join_hint.description && (
                                <div className="text-xs text-slate-300">
                                    {task.join_hint.description}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-1 text-slate-400">
                            No join hint recorded.
                        </div>
                    )}
                </div>
            </div>

            {/* Attached rules */}
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-100">
                        Rules under this DV Task
                    </h2>
                    <span className="text-xs text-slate-400">
                        {rules.length} rule{rules.length === 1 ? "" : "s"}
                    </span>
                </div>
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-900/80">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Schedule
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {rules.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-4 py-4 text-center text-sm text-slate-400"
                            >
                                No rules attached yet.
                            </td>
                        </tr>
                    )}
                    {rules.map((rule) => (
                        <tr key={rule.id}>
                            <td className="px-4 py-2 text-slate-100">
                                <Link
                                    to={`/rules/${encodeURIComponent(
                                        rule.id,
                                    )}`}
                                    className="text-sky-300 hover:text-sky-200"
                                >
                                    {rule.name}
                                </Link>
                            </td>
                            <td className="px-4 py-2 text-slate-200">
                                {rule.status}
                            </td>
                            <td className="px-4 py-2 text-slate-200">
                                {rule.schedule_type}
                            </td>
                            <td className="px-4 py-2 text-right">
                                <Link
                                    to={`/rules/${encodeURIComponent(
                                        rule.id,
                                    )}`}
                                    className="text-xs font-medium text-sky-300 hover:text-sky-200"
                                >
                                    View rule
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
