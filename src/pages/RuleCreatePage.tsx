// src/pages/RuleCreatePage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, apiGet, apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useStripeStatus } from "../hooks/useStripeStatus";
import type {
    SimpleValidationRule,
    RuleStatus,
    RuleScheduleType,
    JoinHint,
    ValidationRule,
} from "../types/api";

interface VelarisObjectOption {
    api_name: string;
    label: string;
}

interface StripeResourceOption {
    system: string;
    resource: string;
    label: string;
}

const RULE_STATUS_OPTIONS: { value: RuleStatus; label: string }[] = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
];

const SCHEDULE_OPTIONS: { value: RuleScheduleType; label: string }[] = [
    { value: "manual", label: "Manual only" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
];

export default function RuleCreatePage() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const stripeStatus = useStripeStatus();

    // Core fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mappingId, setMappingId] = useState("");
    const [status, setStatus] = useState<RuleStatus>("draft");

    // Metadata selects
    const [velarisObjects, setVelarisObjects] = useState<VelarisObjectOption[]>([]);
    const [stripeResources, setStripeResources] = useState<StripeResourceOption[]>([]);
    const [velarisObject, setVelarisObject] = useState<string>("invoice");
    const [stripeResource, setStripeResource] = useState<string>("invoices");

    // Join helper
    const [joinVelarisField, setJoinVelarisField] = useState(
        "velaris.invoice.stripe_invoice_id",
    );
    const [joinSourceField, setJoinSourceField] = useState("stripe.invoice.id");
    const [joinDescription, setJoinDescription] = useState(
        "velaris.invoice.stripe_invoice_id == stripe.invoice.id",
    );

    // DSL JSON
    const [dslText, setDslText] = useState(
        JSON.stringify({ source: "invoices", metric: "count" }, null, 2),
    );

    // Schedule
    const [scheduleType, setScheduleType] =
        useState<RuleScheduleType>("manual");

    // UI state
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Velaris objects + Stripe resources metadata
    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        const loadMetadata = async () => {
            try {
                const [velarisResp, stripeResp] = await Promise.all([
                    apiGet<VelarisObjectOption[]>("/metadata/velaris-objects"),
                    apiGet<StripeResourceOption[]>("/metadata/stripe-resources"),
                ]);
                if (cancelled) return;

                setVelarisObjects(velarisResp);
                setStripeResources(stripeResp);

                if (!velarisObject && velarisResp.length > 0) {
                    setVelarisObject(velarisResp[0].api_name);
                }
                if (!stripeResource && stripeResp.length > 0) {
                    setStripeResource(stripeResp[0].resource);
                }
            } catch (err) {
                if (cancelled) return;
                console.error("Failed to load metadata", err);
                // non-fatal: the form still works with default values
            }
        };

        void loadMetadata();

        return () => {
            cancelled = true;
        };
    }, [token, velarisObject, stripeResource]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApiError(null);

        if (!token) {
            setApiError("You are not authenticated.");
            return;
        }

        // Parse DSL JSON
        let parsedDsl: SimpleValidationRule;
        try {
            const parsed = JSON.parse(dslText);
            if (!parsed || typeof parsed !== "object") {
                throw new Error("DSL must be a JSON object.");
            }
            if (!("source" in parsed) || !("metric" in parsed)) {
                throw new Error('DSL must contain at least "source" and "metric".');
            }
            parsedDsl = parsed as SimpleValidationRule;
        } catch {
            setApiError(
                'Invalid DSL JSON. Use something like: {"source": "invoices", "metric": "count"}.',
            );
            return;
        }

        const cleanedName = name.trim();
        if (!cleanedName) {
            setApiError("Name is required.");
            return;
        }

        const payload: Partial<ValidationRule> & {
            dsl: SimpleValidationRule;
            status: RuleStatus;
            schedule_type: RuleScheduleType;
        } = {
            name: cleanedName,
            description: description.trim() || null,
            mapping_id: mappingId.trim() || null,
            status,
            dsl: parsedDsl,
            velaris_object: velarisObject || null,
            source_system: "stripe",
            source_resource: stripeResource || null,
            schedule_type: scheduleType,
        };

        const cleanedVelarisField = joinVelarisField.trim();
        const cleanedSourceField = joinSourceField.trim();
        const cleanedJoinDescription = joinDescription.trim();

        if (cleanedVelarisField && cleanedSourceField) {
            const joinHint: JoinHint = {
                velaris_field: cleanedVelarisField,
                source_field: cleanedSourceField,
                ...(cleanedJoinDescription ? { description: cleanedJoinDescription } : {}),
            };
            payload.join_hint = joinHint;
        }

        setIsSubmitting(true);
        try {
            await apiPost<ValidationRule>("/validation-rules", payload);
            navigate("/rules");
        } catch (err) {
            console.error("Failed to create rule", err);

            if (err instanceof ApiError) {
                let detailMessage = err.message;

                if (Array.isArray(err.details)) {
                    const detailsArray = err.details as unknown[];
                    if (detailsArray.length > 0) {
                        detailMessage = detailsArray.join(" | ");
                    }
                }

                setApiError(`Failed to create rule (${err.status}): ${detailMessage}`);
            } else if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("Failed to create rule. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="px-6 py-8 text-slate-50">
            <div className="mx-auto max-w-6xl">
                {/* Simple header instead of PageHeader to avoid missing component */}
                <div className="mb-4">
                    <Link
                        to="/rules"
                        className="inline-flex items-center text-sm text-sky-300 hover:text-sky-200"
                    >
                        ← Back to rules
                    </Link>
                    <h1 className="mt-3 text-xl font-semibold text-slate-50">
                        Create validation rule
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Define a rule, connect it to Stripe/Velaris, and optionally schedule it
                        to run automatically.
                    </p>
                </div>

                {/* Stripe status callout */}
                <div className="mb-6 rounded-lg border border-sky-700/60 bg-sky-900/40 px-4 py-3 text-sm">
                    <p className="font-semibold text-sky-200">[Object Object]</p>
                    <p className="mt-1 text-sky-100">
                        Integration metadata (target object, Stripe resource, join helper, schedule)
                        is stored alongside the rule to help the worker and future UI.
                    </p>
                    <div className="mt-2 text-xs text-sky-100/80">
                        {stripeStatus.loading && (
                            <span>Checking Stripe connection for this tenant…</span>
                        )}
                        {!stripeStatus.loading &&
                            stripeStatus.status === "connected" && (
                                <span>
                  Stripe is connected. Full runs will use live Stripe data; previews can
                  still use sample data if needed.
                </span>
                            )}
                        {!stripeStatus.loading &&
                            stripeStatus.status === "not_connected" && !stripeStatus.error && (
                                <span>
                  No Stripe integration yet. Rules will run on sample invoices until you
                  connect Stripe in the Integrations section.
                </span>
                            )}
                        {!stripeStatus.loading &&
                            stripeStatus.status === "error" &&
                            stripeStatus.error && (
                                <span className="text-rose-200">
                  Couldn&apos;t check Stripe status: {stripeStatus.error}
                </span>
                            )}
                    </div>
                </div>

                {apiError && (
                    <div className="mb-4 rounded-md border border-rose-700/70 bg-rose-950/60 px-4 py-3 text-sm text-rose-100">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Name + DSL */}
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Daily Stripe invoice count"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Description
                                </label>
                                <textarea
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Simple count of Stripe invoices per day."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Mapping ID (optional)
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={mappingId}
                                    onChange={(e) => setMappingId(e.target.value)}
                                    placeholder="demo-mapping"
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    This links the rule to a specific reconciliation mapping strategy, if
                                    you use one.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Status
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as RuleStatus)}
                                >
                                    {RULE_STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* DSL editor */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Rule DSL (JSON)
                                </label>
                                <span className="text-[10px] text-slate-500">
                  Minimal DSL the worker understands – usually just source + metric.
                </span>
                            </div>
                            <textarea
                                className="mt-1 h-[260px] w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                value={dslText}
                                onChange={(e) => setDslText(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Target & source */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                            <h3 className="text-sm font-semibold text-slate-100">
                                Target &amp; source
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Choose which Velaris object this rule reconciles to, and which Stripe
                                resource it reads from.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Velaris object
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={velarisObject}
                                        onChange={(e) => setVelarisObject(e.target.value)}
                                    >
                                        {velarisObjects.length === 0 && (
                                            <option value="invoice">Invoice</option>
                                        )}
                                        {velarisObjects.map((obj) => (
                                            <option key={obj.api_name} value={obj.api_name}>
                                                {obj.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Stripe resource
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={stripeResource}
                                        onChange={(e) => setStripeResource(e.target.value)}
                                    >
                                        {stripeResources.length === 0 && (
                                            <option value="invoices">Stripe Invoices</option>
                                        )}
                                        {stripeResources.map((res) => (
                                            <option key={res.resource} value={res.resource}>
                                                {res.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                    Currently: {velarisObject || "invoice"} ←→{" "}
                                    {stripeResource || "invoices"} via the join fields below.
                                </p>
                            </div>
                        </div>

                        {/* Join helper */}
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                            <h3 className="text-sm font-semibold text-slate-100">Join helper</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Tell the system how Stripe and Velaris relate. This doesn&apos;t change
                                any data; it just documents the canonical join for this rule.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Velaris field
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={joinVelarisField}
                                        onChange={(e) => setJoinVelarisField(e.target.value)}
                                        placeholder="velaris.invoice.stripe_invoice_id"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Stripe field
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={joinSourceField}
                                        onChange={(e) => setJoinSourceField(e.target.value)}
                                        placeholder="stripe.invoice.id"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Description (optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={joinDescription}
                                        onChange={(e) => setJoinDescription(e.target.value)}
                                        placeholder="velaris.invoice.stripe_invoice_id == stripe.invoice.id"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Example: <code>velaris.invoice.stripe_invoice_id</code> =={" "}
                                        <code>stripe.invoice.id</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-semibold text-slate-100">
                            Schedule (optional)
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                            Manual rules only run when you or the UI trigger them. Scheduled rules
                            will automatically get full runs created by the worker.
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Run schedule
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={scheduleType}
                                    onChange={(e) =>
                                        setScheduleType(e.target.value as RuleScheduleType)
                                    }
                                >
                                    {SCHEDULE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/rules")}
                            className="inline-flex items-center rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating…" : "Create rule"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
