// src/pages/RuleDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";
import type { ValidationJob, ValidationRule } from "../types/api";
import { useAuth } from "../context/AuthContext";

type RunState = "idle" | "running" | "success" | "error";

export default function RuleDetailPage() {
    const { ruleId } = useParams<{ ruleId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [rule, setRule] = useState<ValidationRule | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [runState, setRunState] = useState<RunState>("idle");
    const [runError, setRunError] = useState<string | null>(null);
    const [createdJob, setCreatedJob] = useState<ValidationJob | null>(null);

    useEffect(() => {
        if (!ruleId) return;
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await apiGet<ValidationRule>(
                    `/validation-rules/${encodeURIComponent(ruleId)}`,
                );
                if (!cancelled) {
                    setRule(data);
                }
            } catch (err) {
                if (!cancelled) {
                    const message =
                        err instanceof Error ? err.message : "Failed to load rule";
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
    }, [ruleId]);

    const triggerRun = async (runType: "preview" | "full") => {
        if (!rule) return;
        try {
            setRunState("running");
            setRunError(null);
            setCreatedJob(null);

            const job = await apiPost<ValidationJob>("/validation-jobs", {
                validation_rule_id: rule.id,
                run_type: runType,
            });

            setCreatedJob(job);
            setRunState("success");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create job";
            setRunError(message);
            setRunState("error");
        }
    };

    const handleRunFull = () => {
        void triggerRun("full");
    };

    const handleRunPreview = () => {
        void triggerRun("preview");
    };

    const handleEditRule = () => {
        if (!rule) return;
        navigate(`/rules/${encodeURIComponent(rule.id)}/edit`);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Loading rule…
            </div>
        );
    }

    if (error || !rule) {
        return (
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => navigate("/rules")}
                    className="text-xs text-sky-300 hover:underline"
                >
                    ← Back to rules
                </button>

                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    <p className="font-medium">Failed to load rule</p>
                    <p className="mt-1 text-xs text-red-200/90">
                        {error ?? "Rule not found"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate("/rules")}
                className="text-xs text-sky-300 hover:underline"
            >
                ← Back to rules
            </button>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-lg font-semibold text-slate-100">
                        {rule.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {rule.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleRunPreview}
                        disabled={runState === "running"}
                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                    >
                        Run preview
                    </button>
                    <button
                        type="button"
                        onClick={handleRunFull}
                        disabled={runState === "running"}
                        className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                    >
                        Run full job
                    </button>
                    {user?.role === "ADMIN" && (
                        <button
                            type="button"
                            onClick={handleEditRule}
                            className="rounded-md border border-sky-500/60 bg-slate-900 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/10"
                        >
                            Edit rule
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Rule metadata
                    </h2>
                    <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Rule ID</dt>
                            <dd className="font-mono text-slate-200">{rule.id}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Mapping ID</dt>
                            <dd className="text-slate-200">
                                {rule.mapping_id ?? (
                                    <span className="text-slate-500">—</span>
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Status</dt>
                            <dd>
                                <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                                    {rule.status}
                                </span>
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Source</dt>
                            <dd className="text-slate-200">{rule.dsl?.source}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Metric</dt>
                            <dd className="text-slate-200">{rule.dsl?.metric}</dd>
                        </div>
                        {rule.dsl?.filter && (
                            <div className="flex gap-3">
                                <dt className="mt-0.5 min-w-[80px] text-slate-400">
                                    Filter
                                </dt>
                                <dd className="flex-1 text-slate-200">
                                    {rule.dsl.filter}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Raw DSL JSON
                    </h2>
                    <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950/70 p-3 text-xs text-slate-200">
                        {JSON.stringify(rule.dsl, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="space-y-3">
                {runError && (
                    <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
                        <p className="font-medium">Failed to create job</p>
                        <p className="mt-1 text-red-200/90">{runError}</p>
                    </div>
                )}

                {createdJob && (
                    <div className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-100">
                        <p className="font-medium">Job created</p>
                        <p className="mt-1">
                            ID:{" "}
                            <Link
                                to={`/jobs/${encodeURIComponent(createdJob.id)}`}
                                className="font-mono text-emerald-200 underline"
                            >
                                {createdJob.id}
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
