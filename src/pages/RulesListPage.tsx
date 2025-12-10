// src/pages/RulesListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { SimpleValidationRule, ValidationRule } from "../types/api";
import { useAuth } from "../context/AuthContext";
import {
    archiveRule,
    fetchActiveRules,
    fetchArchivedRules,
    restoreRule,
} from "../api/rules";
import { canArchiveEntities } from "../utils/permissions";

type RulesTab = "active" | "archived";

function formatDslSummary(dsl: SimpleValidationRule | undefined): string {
    if (!dsl) return "-";
    const parts: string[] = [];

    if (dsl.source) {
        parts.push(dsl.source);
    }
    if (dsl.metric) {
        parts.push(`· ${dsl.metric}`);
    }
    if (dsl.filter) {
        parts.push(`· where ${dsl.filter}`);
    }

    return parts.join(" ");
}

function formatDate(value: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

export default function RulesListPage() {
    const { user } = useAuth();
    const canCreateRule = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
    const canArchive = canArchiveEntities(user);

    const [tab, setTab] = useState<RulesTab>("active");

    const [activeRules, setActiveRules] = useState<ValidationRule[]>([]);
    const [archivedRules, setArchivedRules] = useState<ValidationRule[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [actionError, setActionError] = useState<string | null>(null);
    const [actionBusyId, setActionBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                if (tab === "active") {
                    const data = await fetchActiveRules();
                    if (!cancelled) {
                        setActiveRules(data);
                    }
                } else {
                    const data = await fetchArchivedRules();
                    if (!cancelled) {
                        setArchivedRules(data);
                    }
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
    }, [tab]);

    const rules = tab === "active" ? activeRules : archivedRules;

    const hasRules = useMemo(() => rules.length > 0, [rules]);

    const handleArchive = async (ruleId: string) => {
        try {
            setActionError(null);
            setActionBusyId(ruleId);
            const updated = await archiveRule(ruleId);

            setActiveRules((prev) => prev.filter((r) => r.id !== ruleId));
            setArchivedRules((prev) => [...prev, updated]);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to archive rule";
            setActionError(message);
        } finally {
            setActionBusyId(null);
        }
    };

    const handleRestore = async (ruleId: string) => {
        try {
            setActionError(null);
            setActionBusyId(ruleId);
            const updated = await restoreRule(ruleId);

            setArchivedRules((prev) => prev.filter((r) => r.id !== ruleId));
            setActiveRules((prev) => [...prev, updated]);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to restore rule";
            setActionError(message);
        } finally {
            setActionBusyId(null);
        }
    };

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
                <div className="text-sm text-slate-300">
                    There was a problem loading rules.
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
                        Active rules are loaded from{" "}
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                            GET /validation-rules
                        </code>
                        . Archived rules use{" "}
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                            GET /validation-rules/archived
                        </code>
                        .
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

                {actionError && (
                    <p className="text-xs text-red-400">{actionError}</p>
                )}
            </div>

            {!hasRules ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-300">
                    {tab === "active"
                        ? "No rules found for this tenant."
                        : "No archived rules for this tenant yet."}
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
                            <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                Archived
                            </th>
                            {canArchive && (
                                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Actions
                                </th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {rules.map((rule) => {
                            const archived = !!rule.archived_at;
                            const busy = actionBusyId === rule.id;

                            return (
                                <tr
                                    key={rule.id}
                                    className="border-t border-slate-800/60 hover:bg-slate-800/60"
                                >
                                    <td className="px-4 py-2">
                                        <Link
                                            to={`/rules/${encodeURIComponent(
                                                rule.id,
                                            )}`}
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
                                            <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                                                {rule.status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-300">
                                        {formatDslSummary(
                                            rule.dsl as SimpleValidationRule | undefined,
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-400">
                                        {archived ? (
                                            <>
                                                    <span className="block text-slate-200">
                                                        Archived
                                                    </span>
                                                <span className="block text-[11px]">
                                                        {formatDate(rule.archived_at)}
                                                    </span>
                                            </>
                                        ) : (
                                            <span className="text-slate-500">
                                                    Not archived
                                                </span>
                                        )}
                                    </td>
                                    {canArchive && (
                                        <td className="px-4 py-2 text-xs text-right">
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    archived
                                                        ? handleRestore(rule.id)
                                                        : handleArchive(rule.id)
                                                }
                                                className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                                                    archived
                                                        ? "border-emerald-500/60 text-emerald-100 hover:bg-emerald-900/40"
                                                        : "border-amber-500/60 text-amber-100 hover:bg-amber-900/40"
                                                } disabled:opacity-60`}
                                            >
                                                {busy
                                                    ? archived
                                                        ? "Restoring…"
                                                        : "Archiving…"
                                                    : archived
                                                        ? "Restore"
                                                        : "Archive"}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
