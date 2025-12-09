import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api/client";
import type { SimpleValidationRule, ValidationRule } from "../types/api";
import { useAuth } from "../context/AuthContext";

function formatDslSummary(dsl: SimpleValidationRule | undefined): string {
    if (!dsl) return "-";
    const parts: string[] = [];

    if (dsl.source) {
        parts.push(dsl.source);
    }
    if (dsl.metric) {
        parts.push(`• ${dsl.metric}`);
    }
    if (dsl.filter) {
        parts.push(`• filter: ${dsl.filter}`);
    }

    return parts.join(" ");
}

function formatStatus(status: string): string {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function RulesListPage() {
    const { user } = useAuth();
    const canCreateRule = user?.role === "ADMIN";

    const [rules, setRules] = useState<ValidationRule[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await apiGet<ValidationRule[]>("/validation-rules");
                if (!cancelled) {
                    setRules(data);
                }
            } catch (err) {
                if (!cancelled) {
                    const message =
                        err instanceof Error ? err.message : "Failed to load rules";
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

    const hasRules = useMemo(() => rules.length > 0, [rules]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Loading rules…
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-100">
                        Validation rules
                    </h1>
                    {canCreateRule && (
                        <Link
                            to="/rules/new"
                            className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                        >
                            New rule
                        </Link>
                    )}
                </div>
                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    <p className="font-medium">Failed to load rules</p>
                    <p className="mt-1 text-xs text-red-200/90">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-slate-100">
                        Validation rules
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Rules are loaded from{" "}
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                            GET /validation-rules
                        </code>
                        . Click a row to see details and run a job.
                    </p>
                </div>

                {canCreateRule && (
                    <Link
                        to="/rules/new"
                        className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                    >
                        New rule
                    </Link>
                )}
            </div>

            {!hasRules ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-300">
                    No rules found for this tenant.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-800/80 bg-slate-900">
                        <tr>
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Name
                            </th>
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Mapping ID
                            </th>
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Status
                            </th>
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                DSL summary
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {rules.map((rule) => (
                            <tr
                                key={rule.id}
                                className="border-t border-slate-800/60 hover:bg-slate-800/60"
                            >
                                <td className="px-4 py-2">
                                    <Link
                                        to={`/rules/${encodeURIComponent(rule.id)}`}
                                        className="text-sm font-medium text-sky-300 hover:underline"
                                    >
                                        {rule.name}
                                    </Link>
                                    {rule.description && (
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {rule.description}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-300">
                                    {rule.mapping_id ?? (
                                        <span className="text-slate-500">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                    <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-medium text-slate-200">
                      {formatStatus(rule.status)}
                    </span>
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-300">
                                    {formatDslSummary(rule.dsl)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
