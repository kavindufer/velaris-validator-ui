import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DvTask } from "../types/api";
import { fetchDvTasks } from "../api/dvTasks";
import { ApiError } from "../api/client";

export default function DvTasksListPage() {
    const [tasks, setTasks] = useState<DvTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await fetchDvTasks();
                if (cancelled) return;
                setTasks(resp);
            } catch (err) {
                console.error("Failed to load DV tasks", err);
                if (err instanceof ApiError) {
                    setError(
                        `Failed to load DV tasks (${err.status}): ${err.message}`,
                    );
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load DV tasks.");
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-50">
                        Data Validation Tasks
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Each DV Task groups multiple validation rules that run
                        against Stripe data.
                    </p>
                </div>
                <div>
                    <Link
                        to="/dv-tasks/new"
                        className="inline-flex items-center rounded-lg border border-sky-500 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-500"
                    >
                        + Create DV Task
                    </Link>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-500/70 bg-rose-950/60 px-4 py-3 text-sm text-rose-100">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Target object
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Dedupe key
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {loading && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-4 py-6 text-center text-sm text-slate-400"
                            >
                                Loading DV tasks…
                            </td>
                        </tr>
                    )}

                    {!loading && tasks.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-4 py-6 text-center text-sm text-slate-400"
                            >
                                No DV Tasks yet. Create one to generate
                                rules from your mappings.
                            </td>
                        </tr>
                    )}

                    {!loading &&
                        tasks.map((task) => (
                            <tr key={task.id}>
                                <td className="px-4 py-3 text-sm text-slate-100">
                                    <Link
                                        to={`/dv-tasks/${encodeURIComponent(
                                            task.id,
                                        )}`}
                                        className="font-medium text-sky-300 hover:text-sky-200"
                                    >
                                        {task.name}
                                    </Link>
                                    {task.description && (
                                        <div className="mt-0.5 text-xs text-slate-400">
                                            {task.description}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-200">
                                    Stripe {task.source_resource}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-200">
                                    {task.target_velaris_object}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-200">
                                    {task.dedupe_key}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <Link
                                        to={`/dv-tasks/${encodeURIComponent(
                                            task.id,
                                        )}`}
                                        className="text-sm font-medium text-sky-300 hover:text-sky-200"
                                    >
                                        View
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
