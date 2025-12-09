import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, apiGet, apiPatch } from "../api/client";
import type { RuleStatus, ValidationRule } from "../types/api";

type RouteParams = {
    ruleId: string;
};

export default function RuleEditPage() {
    const { ruleId } = useParams<RouteParams>();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mappingId, setMappingId] = useState("");
    const [status, setStatus] = useState<RuleStatus>("draft");
    const [dslText, setDslText] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!ruleId) {
                setLoadError("Missing rule id in URL.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setLoadError(null);

                const rule = await apiGet<ValidationRule>(
                    `/validation-rules/${encodeURIComponent(ruleId)}`,
                );

                if (cancelled) return;

                setName(rule.name);
                setDescription(rule.description ?? "");
                setMappingId(rule.mapping_id ?? "");
                setStatus(rule.status);
                setDslText(JSON.stringify(rule.dsl, null, 2));
            } catch (err) {
                if (!cancelled) {
                    const msg =
                        err instanceof Error ? err.message : "Failed to load rule.";
                    setLoadError(msg);
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

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setFormError(null);
        setApiError(null);

        if (!ruleId) {
            setFormError("Missing rule id in URL.");
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            setFormError("Name is required.");
            return;
        }

        let dslObj: Record<string, unknown>;
        try {
            const parsed = JSON.parse(dslText) as unknown;
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
                setFormError(
                    'DSL must be a JSON object (e.g. { "source": "invoices", ... }).',
                );
                return;
            }
            dslObj = parsed as Record<string, unknown>;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "DSL JSON could not be parsed.";
            setFormError(`Invalid DSL JSON: ${msg}`);
            return;
        }

        try {
            setSubmitting(true);

            const updated = await apiPatch<ValidationRule>(
                `/validation-rules/${encodeURIComponent(ruleId)}`,
                {
                    name: trimmedName,
                    description: description.trim() || null,
                    mapping_id: mappingId.trim() || null,
                    status,
                    dsl: dslObj,
                },
            );

            navigate(`/rules/${encodeURIComponent(updated.id)}`, { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setApiError(err.message);
            } else if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("Unexpected error while saving rule.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Loading rule…
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-3">
                <h1 className="text-lg font-semibold text-slate-100">Edit rule</h1>
                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    <p className="font-medium">Failed to load rule</p>
                    <p className="mt-1 text-xs text-red-200/90">{loadError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                    >
                        &larr; Back to rule
                    </button>
                    <h1 className="text-lg font-semibold text-slate-100">Edit rule</h1>
                    <p className="text-sm text-slate-400">
                        Update the rule metadata and DSL JSON. This will call{" "}
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">
                            PATCH /validation-rules/{ruleId}
                        </code>
                        .
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
            >
                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">
                            Mapping ID
                        </label>
                        <input
                            type="text"
                            value={mappingId}
                            onChange={(e) => setMappingId(e.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
                            placeholder="map_stripe_invoices"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as RuleStatus)}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
                        >
                            <option value="draft">draft</option>
                            <option value="verified">verified</option>
                            <option value="active">active</option>
                        </select>
                    </div>

                    {formError && (
                        <div className="rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
                            {formError}
                        </div>
                    )}
                    {apiError && (
                        <div className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
                            {apiError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : "Save changes"}
                    </button>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            DSL JSON
                        </h2>
                        <span className="text-[10px] text-slate-500">
                            Edit carefully – must be valid JSON
                        </span>
                    </div>
                    <textarea
                        value={dslText}
                        onChange={(e) => setDslText(e.target.value)}
                        rows={22}
                        className="font-mono text-xs w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                        spellCheck={false}
                    />
                </div>
            </form>
        </div>
    );
}
