import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, apiGet, apiPatch } from "../api/client";
import type {
    RuleScheduleType,
    RuleStatus,
    ValidationRule,
} from "../types/api";
import {
    fetchStripeResources,
    fetchVelarisObjects,
    type StripeResourceMeta,
    type VelarisObjectMeta,
} from "../api/metadata";

const FALLBACK_VELARIS_OBJECTS: VelarisObjectMeta[] = [
    { api_name: "organization", label: "Organization" },
    { api_name: "account", label: "Account" },
    { api_name: "contact", label: "Contact" },
    { api_name: "pipeline", label: "Pipeline" },
    { api_name: "invoice", label: "Invoice" },
];

const FALLBACK_STRIPE_RESOURCES: StripeResourceMeta[] = [
    { system: "stripe", resource: "customers", label: "Stripe Customers" },
    { system: "stripe", resource: "invoices", label: "Stripe Invoices" },
];

export default function RuleEditPage() {
    // Be forgiving about the param name: allow both :id and :ruleId
    const params = useParams();
    const ruleId = (params.id ?? params.ruleId ?? "").trim();

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mappingId, setMappingId] = useState("");
    const [status, setStatus] = useState<RuleStatus>("draft");
    const [dslText, setDslText] = useState<string>("");

    const [apiError, setApiError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // metadata
    const [velarisObjects, setVelarisObjects] = useState<VelarisObjectMeta[]>(
        FALLBACK_VELARIS_OBJECTS,
    );
    const [stripeResources, setStripeResources] = useState<StripeResourceMeta[]>(
        FALLBACK_STRIPE_RESOURCES,
    );

    const [velarisObject, setVelarisObject] = useState<string>("invoice");
    const [sourceSystem] = useState<string>("stripe");
    const [sourceResource, setSourceResource] = useState<string>("invoices");

    const [joinVelarisField, setJoinVelarisField] =
        useState<string>("stripe_invoice_id");
    const [joinSourceField, setJoinSourceField] = useState<string>("id");
    const [joinDescription, setJoinDescription] = useState<string>(
        "velaris.invoice.stripe_invoice_id == stripe.invoice.id",
    );

    const [scheduleType, setScheduleType] =
        useState<RuleScheduleType>("manual");
    const [nextScheduledRunAt, setNextScheduledRunAt] = useState<string | null>(
        null,
    );
    const [metadataLoading, setMetadataLoading] = useState(false);

    // Load rule
    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!ruleId) {
                setLoadError("Missing rule id.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const rule = await apiGet<ValidationRule>(
                    `/validation-rules/${encodeURIComponent(ruleId)}`,
                );

                if (cancelled) return;

                setName(rule.name);
                setDescription(rule.description ?? "");
                setMappingId(rule.mapping_id ?? "");
                setStatus(rule.status as RuleStatus);
                setDslText(JSON.stringify(rule.dsl ?? {}, null, 2));

                setVelarisObject(rule.velaris_object ?? "invoice");
                setSourceResource(rule.source_resource ?? "invoices");

                if (rule.join_hint) {
                    setJoinVelarisField(
                        rule.join_hint.velaris_field ?? "stripe_invoice_id",
                    );
                    setJoinSourceField(rule.join_hint.source_field ?? "id");
                    setJoinDescription(rule.join_hint.description ?? "");
                }

                setScheduleType(
                    (rule.schedule_type as RuleScheduleType) ?? "manual",
                );
                setNextScheduledRunAt(rule.next_scheduled_run_at ?? null);
            } catch (err) {
                if (err instanceof ApiError) {
                    setLoadError(err.message);
                } else if (err instanceof Error) {
                    setLoadError(err.message);
                } else {
                    setLoadError("Failed to load rule.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [ruleId]);

    // Load metadata options
    useEffect(() => {
        let cancelled = false;

        async function loadMetadata() {
            setMetadataLoading(true);
            try {
                const [velaris, stripe] = await Promise.all([
                    fetchVelarisObjects(),
                    fetchStripeResources(),
                ]);

                if (cancelled) return;

                if (velaris && velaris.length) {
                    setVelarisObjects(velaris);
                    const existing = velaris.find((v) => v.api_name === velarisObject);
                    if (!existing) {
                        setVelarisObject(
                            velaris.find((v) => v.api_name === "invoice")?.api_name ??
                            velaris[0].api_name,
                        );
                    }
                }

                if (stripe && stripe.length) {
                    setStripeResources(stripe);
                    const existing = stripe.find((r) => r.resource === sourceResource);
                    if (!existing) {
                        setSourceResource(
                            stripe.find((r) => r.resource === "invoices")?.resource ??
                            stripe[0].resource,
                        );
                    }
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn("Failed to load metadata, using fallbacks.", err);
            } finally {
                if (!cancelled) {
                    setMetadataLoading(false);
                }
            }
        }

        loadMetadata();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError(null);
        setApiError(null);

        if (!ruleId) {
            setFormError("Missing rule id.");
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            setFormError("Name is required.");
            return;
        }

        let dslObj: unknown;
        try {
            dslObj = JSON.parse(dslText);
        } catch {
            setFormError("DSL must be valid JSON.");
            return;
        }

        const payload: Record<string, unknown> = {
            name: trimmedName,
            description: description.trim() || null,
            mapping_id: mappingId.trim() || null,
            status,
            dsl: dslObj,
        };

        if (velarisObject) {
            payload.velaris_object = velarisObject;
        }
        if (sourceSystem) {
            payload.source_system = sourceSystem;
        }
        if (sourceResource) {
            payload.source_resource = sourceResource;
        }

        const cleanedJoinVelaris = joinVelarisField.trim();
        const cleanedJoinSource = joinSourceField.trim();
        const cleanedJoinDescription = joinDescription.trim();

        if (cleanedJoinVelaris && cleanedJoinSource) {
            payload.join_hint = {
                velaris_field: cleanedJoinVelaris,
                source_field: cleanedJoinSource,
                ...(cleanedJoinDescription
                    ? { description: cleanedJoinDescription }
                    : {}),
            };
        }

        payload.schedule_type = scheduleType;

        try {
            setSaving(true);
            await apiPatch<ValidationRule>(
                `/validation-rules/${encodeURIComponent(ruleId)}`,
                payload,
            );
            navigate("/rules");
        } catch (err) {
            if (err instanceof ApiError) {
                setApiError(err.message);
            } else if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("Failed to update rule.");
            }
        } finally {
            setSaving(false);
        }
    }

    const currentVelarisLabel =
        velarisObjects.find((v) => v.api_name === velarisObject)?.label ??
        velarisObject;

    const currentStripeLabel =
        stripeResources.find((r) => r.resource === sourceResource)?.label ??
        sourceResource;

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
                    <h1 className="text-lg font-semibold text-slate-50">
                        Edit validation rule
                    </h1>
                    <p className="text-xs text-slate-400">
                        Update the rule definition, metadata, and schedule.
                    </p>
                </div>
            </div>

            {isLoading && (
                <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-200">
                    Loading rule…
                </div>
            )}

            {loadError && !isLoading && (
                <div className="rounded-md border border-rose-500 bg-rose-950/50 p-3 text-xs text-rose-100">
                    {loadError}
                </div>
            )}

            {!isLoading && !loadError && (
                <>
                    {formError && (
                        <div className="rounded-md border border-rose-500 bg-rose-950/50 p-3 text-xs text-rose-100">
                            {formError}
                        </div>
                    )}

                    {apiError && (
                        <div className="rounded-md border border-amber-500 bg-amber-950/40 p-3 text-xs text-amber-100">
                            {apiError}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
                    >
                        {/* Left column */}
                        <div className="space-y-3">
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-200">
                                    Name
                                </label>
                                <input
                                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-200">
                                    Description
                                </label>
                                <textarea
                                    className="h-16 w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Mapping ID */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-200">
                                    Mapping ID (optional)
                                </label>
                                <input
                                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={mappingId}
                                    onChange={(e) => setMappingId(e.target.value)}
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-200">
                                    Status
                                </label>
                                <select
                                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as RuleStatus)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="verified">Verified</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>

                            {/* Target & source */}
                            <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900/40 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-slate-200">
                                        Target &amp; source
                                    </p>
                                    {metadataLoading && (
                                        <span className="text-[10px] text-slate-500">
                      Loading options…
                    </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Choose which Velaris object this rule reconciles to, and
                                    which Stripe resource it reads from.
                                </p>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] text-slate-300">
                                            Velaris object
                                        </label>
                                        <select
                                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                            value={velarisObject}
                                            onChange={(e) => setVelarisObject(e.target.value)}
                                        >
                                            {velarisObjects.map((o) => (
                                                <option key={o.api_name} value={o.api_name}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[11px] text-slate-300">
                                            Stripe resource
                                        </label>
                                        <select
                                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                            value={sourceResource}
                                            onChange={(e) => setSourceResource(e.target.value)}
                                        >
                                            {stripeResources.map((r) => (
                                                <option key={r.resource} value={r.resource}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-500">
                                    Currently:{" "}
                                    <span className="font-semibold">
                    {currentVelarisLabel}
                  </span>{" "}
                                    ⇐{" "}
                                    <span className="font-semibold">
                    {currentStripeLabel}
                  </span>{" "}
                                    via the join fields below.
                                </p>
                            </div>

                            {/* Join helper */}
                            <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900/40 p-3">
                                <p className="text-xs font-medium text-slate-200">
                                    Join helper
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    Document how Stripe and Velaris relate for this rule.
                                </p>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] text-slate-300">
                                            Velaris field
                                        </label>
                                        <input
                                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                            value={joinVelarisField}
                                            onChange={(e) => setJoinVelarisField(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] text-slate-300">
                                            Stripe field
                                        </label>
                                        <input
                                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                            value={joinSourceField}
                                            onChange={(e) => setJoinSourceField(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] text-slate-300">
                                        Description (optional)
                                    </label>
                                    <input
                                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={joinDescription}
                                        onChange={(e) => setJoinDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900/40 p-3">
                                <p className="text-xs font-medium text-slate-200">
                                    Schedule
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    Manual rules only run when triggered. Scheduled rules get
                                    full jobs created automatically.
                                </p>

                                <div className="space-y-1">
                                    <label className="block text-[11px] text-slate-300">
                                        Run schedule
                                    </label>
                                    <select
                                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        value={scheduleType}
                                        onChange={(e) =>
                                            setScheduleType(e.target.value as RuleScheduleType)
                                        }
                                    >
                                        <option value="manual">Manual only</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>

                                {nextScheduledRunAt && (
                                    <p className="text-[10px] text-slate-500">
                                        Next scheduled run:{" "}
                                        <span className="font-medium text-slate-200">
                      {new Date(nextScheduledRunAt).toLocaleString()}
                    </span>
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-slate-50 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Saving…" : "Save changes"}
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => navigate("/rules")}
                                    className="rounded-md border border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Right column – DSL JSON */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-medium text-slate-200">
                                        Rule DSL (JSON)
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Edit the underlying DSL that the worker executes.
                                    </p>
                                </div>
                            </div>

                            <textarea
                                className="h-[260px] w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                value={dslText}
                                onChange={(e) => setDslText(e.target.value)}
                            />
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
