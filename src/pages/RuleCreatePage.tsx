import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, apiPost } from "../api/client";
import type { RuleStatus, ValidationRule } from "../types/api";

const DEFAULT_DSL = JSON.stringify(
    {
        source: "invoices",
        metric: "count",
        filter: "status = 'open'",
    },
    null,
    2,
);

export default function RuleCreatePage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mappingId, setMappingId] = useState("");
    const [status, setStatus] = useState<RuleStatus>("draft");
    const [dslText, setDslText] = useState(DEFAULT_DSL);

    const [error, setError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setApiError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Name is required.");
            return;
        }

        let dslObj: Record<string, unknown>;
        try {
            const parsed = JSON.parse(dslText) as unknown;
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
                setError("DSL must be a JSON object (e.g. { \"source\": \"invoices\", ... }).");
                return;
            }
            dslObj = parsed as Record<string, unknown>;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "DSL JSON could not be parsed.";
            setError(`Invalid DSL JSON: ${msg}`);
            return;
        }

        const payload = {
            name: trimmedName,
            description: description.trim(),
            mapping_id: mappingId.trim() || null,
            status,
            dsl: dslObj,
        };

        setSubmitting(true);
        try {
            const created = await apiPost<ValidationRule>("/validation-rules", payload);
            navigate(`/rules/${encodeURIComponent(created.id)}`);
        } catch (err) {
            if (err instanceof ApiError) {
                setApiError(err.message);
            } else if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("Failed to create rule.");
            }
        } finally {
            setSubmitting(false);
        }
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
                        New validation rule
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Define a rule name, mapping, status and DSL JSON. The backend will
                        validate the DSL and persist the rule for this tenant.
                    </p>
                </div>
            </div>

            {(error || apiError) && (
                <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                    {error ?? apiError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-200">
                                Name<span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-400"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="All invoices count"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-200">
                                Description
                            </label>
                            <textarea
                                className="min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-400"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short explanation of what this rule checks."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-200">
                                Mapping ID
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-400"
                                value={mappingId}
                                onChange={(e) => setMappingId(e.target.value)}
                                placeholder="stripe_invoice"
                            />
                            <p className="text-[11px] text-slate-500">
                                Optional ID used to link this rule to a particular data mapping.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-200">
                                Status
                            </label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-400"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as RuleStatus)}
                            >
                                <option value="draft">draft</option>
                                <option value="verified">verified</option>
                                <option value="active">active</option>
                            </select>
                            <p className="text-[11px] text-slate-500">
                                If you choose <code className="font-mono">active</code>, the
                                backend will eagerly validate the DSL before saving.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-200">
                            DSL JSON<span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            className="h-[260px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-50 outline-none focus:border-sky-400"
                            value={dslText}
                            onChange={(e) => setDslText(e.target.value)}
                        />
                        <p className="text-[11px] text-slate-500">
                            This JSON is stored as <code className="font-mono">dsl_json</code>{" "}
                            in the rule config and parsed into the simple DSL model.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md bg-sky-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Creating rule…" : "Create rule"}
                    </button>
                </div>
            </form>
        </div>
    );
}
