import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
    fetchVelarisObjects,
    fetchStripeResources,
    type VelarisObjectMeta,
    type StripeResourceMeta,
} from "../api/metadata";
import { useStripeStatus } from "../hooks/useStripeStatus";
import type { JoinHint } from "../types/api";
import { createDvTask, type DvTaskDesignPayload } from "../api/dvTasks";

export default function DvTaskNewPage() {
    const navigate = useNavigate();
    const stripeStatus = useStripeStatus();

    const [velarisObjects, setVelarisObjects] = useState<VelarisObjectMeta[]>(
        [],
    );
    const [stripeResources, setStripeResources] = useState<StripeResourceMeta[]>(
        [],
    );

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const [velarisObject, setVelarisObject] = useState<string>("");
    const [stripeResource, setStripeResource] = useState<string>("");

    const [dedupeKey, setDedupeKey] = useState<string>("external_id");

    const [joinVelarisField, setJoinVelarisField] = useState<string>("");
    const [joinSourceField, setJoinSourceField] = useState<string>("");
    const [joinDescription, setJoinDescription] = useState<string>("");

    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Load metadata
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [velaris, stripe] = await Promise.all([
                    fetchVelarisObjects(),
                    fetchStripeResources(),
                ]);

                if (cancelled) return;

                setVelarisObjects(velaris);
                setStripeResources(stripe);

                if (!velarisObject && velaris.length > 0) {
                    setVelarisObject(velaris[0].api_name);
                }
                if (!stripeResource && stripe.length > 0) {
                    setStripeResource(stripe[0].resource);
                }
            } catch (err) {
                console.error("Failed to load metadata", err);
                if (!cancelled) {
                    setApiError("Failed to load metadata for DV Task.");
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setApiError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setApiError("Name is required.");
            return;
        }

        if (!velarisObject || !stripeResource) {
            setApiError(
                "Please select both a target Velaris object and a Stripe resource.",
            );
            return;
        }

        const cleanedDedupeKey = dedupeKey.trim();
        if (!cleanedDedupeKey) {
            setApiError("Dedupe key is required.");
            return;
        }

        const cleanedVelarisField = joinVelarisField.trim();
        const cleanedSourceField = joinSourceField.trim();
        if (!cleanedVelarisField || !cleanedSourceField) {
            setApiError(
                "Join helper fields are required (Velaris field and Stripe field).",
            );
            return;
        }

        const joinHint: JoinHint = {
            velaris_field: cleanedVelarisField,
            source_field: cleanedSourceField,
            ...(joinDescription.trim()
                ? { description: joinDescription.trim() }
                : {}),
        };

        const payload: DvTaskDesignPayload = {
            name: trimmedName,
            description: description.trim() || null,
            target_velaris_object: velarisObject,
            source_resource: stripeResource,
            dedupe_key: cleanedDedupeKey,
            join_hint: joinHint,
            direct_mappings: [],
            transformations: [],
        };

        setIsSubmitting(true);
        try {
            const created = await createDvTask(payload);
            navigate(`/dv-tasks/${encodeURIComponent(created.task.id)}`);
        } catch (err) {
            console.error("Failed to create DV Task", err);
            if (err instanceof ApiError) {
                let detailMessage = err.message;

                if (Array.isArray(err.details)) {
                    const detailsArray = err.details as unknown[];
                    if (detailsArray.length > 0) {
                        detailMessage = detailsArray.join(" | ");
                    }
                } else if (
                    err.details &&
                    typeof err.details === "object" &&
                    "validation_errors" in err.details
                ) {
                    // Backend returns { validation_errors: [...] }
                    const ve = (err.details as any).validation_errors;
                    if (Array.isArray(ve) && ve.length > 0) {
                        detailMessage = ve
                            .map((x: any) =>
                                typeof x === "string"
                                    ? x
                                    : JSON.stringify(x),
                            )
                            .join(" | ");
                    }
                }

                setApiError(
                    `Failed to create DV Task (${err.status}): ${detailMessage}`,
                );
            } else if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("Failed to create DV Task. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/dv-tasks"
                        className="text-xs font-medium uppercase tracking-wide text-sky-300 hover:text-sky-200"
                    >
                        ← Back to DV Tasks
                    </Link>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-50">
                        Create DV Task
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Describe how Stripe data should map to Velaris, and
                        we’ll generate one or more validation rules for you.
                    </p>
                </div>
            </div>

            {/* Stripe status callout */}
            <div className="rounded-lg border border-sky-700/60 bg-sky-900/40 px-4 py-3 text-sm">
                <p className="font-semibold text-sky-100">
                    Stripe connection for this tenant
                </p>
                <div className="mt-1 text-sky-100/90">
                    {stripeStatus.loading && (
                        <span>
                            Checking Stripe connection for this tenant…
                        </span>
                    )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "connected" && (
                            <span>
                                Stripe is connected. Full runs of this DV Task
                                will pull live Stripe data.
                            </span>
                        )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "not_connected" && (
                            <span>
                                Stripe is not connected. You can still define a
                                DV Task, but full runs may fall back or fail
                                until a valid key is configured.
                            </span>
                        )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "error" && (
                            <span>
                                Could not determine Stripe status. Check your
                                integration settings.
                            </span>
                        )}
                </div>
            </div>

            {apiError && (
                <div className="rounded-lg border border-rose-500/70 bg-rose-950/60 px-4 py-3 text-sm text-rose-100">
                    {apiError}
                </div>
            )}

            <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-5">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Basics */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-100">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                placeholder="Customers → Accounts DV Task"
                            />
                            <p className="text-xs text-slate-400">
                                A human-friendly name for this DV Task.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-100">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                rows={3}
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                placeholder="e.g. Check duplicate Stripe customers and basic field mappings to Accounts."
                            />
                        </div>
                    </div>

                    {/* Source & target */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-100">
                                Stripe resource
                            </label>
                            <select
                                value={stripeResource}
                                onChange={(e) =>
                                    setStripeResource(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            >
                                {stripeResources.map((res) => (
                                    <option
                                        key={res.resource}
                                        value={res.resource}
                                    >
                                        {res.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400">
                                Which Stripe collection this DV Task reads from.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-100">
                                Target Velaris object
                            </label>
                            <select
                                value={velarisObject}
                                onChange={(e) =>
                                    setVelarisObject(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            >
                                {velarisObjects.map((obj) => (
                                    <option
                                        key={obj.api_name}
                                        value={obj.api_name}
                                    >
                                        {obj.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400">
                                Which Velaris object these records should map
                                into.
                            </p>
                        </div>
                    </div>

                    {/* Dedupe key */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-100">
                            Dedupe key (Velaris field)
                        </label>
                        <input
                            type="text"
                            value={dedupeKey}
                            onChange={(e) => setDedupeKey(e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="external_id or email"
                        />
                        <p className="text-xs text-slate-400">
                            Which Velaris field should be unique across mapped
                            records (e.g. <code>external_id</code> or{" "}
                            <code>email</code>).
                        </p>
                    </div>

                    {/* Join helper */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-100">
                            Join helper
                        </label>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <span className="block text-xs font-medium text-slate-300">
                                    Velaris field
                                </span>
                                <input
                                    type="text"
                                    value={joinVelarisField}
                                    onChange={(e) =>
                                        setJoinVelarisField(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    placeholder="account.stripe_customer_id"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-xs font-medium text-slate-300">
                                    Stripe field
                                </span>
                                <input
                                    type="text"
                                    value={joinSourceField}
                                    onChange={(e) =>
                                        setJoinSourceField(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    placeholder="customer_id"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-xs font-medium text-slate-300">
                                    Description (optional)
                                </span>
                                <input
                                    type="text"
                                    value={joinDescription}
                                    onChange={(e) =>
                                        setJoinDescription(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    placeholder="Join on Stripe customer ID"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            This helps the worker (and future UI) understand how
                            to link Stripe records to Velaris records.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            to="/dv-tasks"
                            className="text-sm text-slate-300 hover:text-slate-100"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center rounded-lg border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Creating DV Task…"
                                : "Generate rules & create task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
