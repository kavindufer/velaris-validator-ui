import { useState } from "react";
import { Link } from "react-router-dom";
import { useStripeStatus } from "../hooks/useStripeStatus";
import { upsertStripeIntegration } from "../api/integrations";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function IntegrationsPage() {
    const stripeStatus = useStripeStatus();
    const { user } = useAuth();

    const isTenantAdmin = user?.role === "ADMIN";

    const [apiKey, setApiKey] = useState("");
    const [accountId, setAccountId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!apiKey.trim()) {
            setError("Stripe secret key is required.");
            return;
        }

        setSubmitting(true);
        try {
            await upsertStripeIntegration({
                api_key: apiKey.trim(),
                account_id: accountId.trim() || null,
            });

            setSuccess("Stripe credentials saved successfully.");
            setApiKey("");
            setAccountId("");
        } catch (err) {
            console.error("Failed to upsert Stripe integration", err);
            if (err instanceof ApiError) {
                setError(
                    `Failed to save Stripe credentials (${err.status}): ${err.message}`,
                );
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to save Stripe credentials.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const statusLabel =
        stripeStatus.status === "connected"
            ? "Connected"
            : stripeStatus.status === "not_connected"
                ? "Not connected"
                : stripeStatus.status === "error"
                    ? "Error"
                    : "Unknown";

    const statusColor =
        stripeStatus.status === "connected"
            ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/60"
            : stripeStatus.status === "error"
                ? "bg-rose-500/20 text-rose-200 border-rose-500/60"
                : "bg-slate-700/40 text-slate-200 border-slate-500/60";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/rules"
                        className="text-xs font-medium uppercase tracking-wide text-sky-300 hover:text-sky-200"
                    >
                        ← Back to workspace
                    </Link>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-50">
                        Integrations
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Manage external integrations for this tenant. Right now,
                        we support Stripe.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-100">
                            Stripe
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Connect your Stripe account so DV Tasks and
                            validation rules can run against live Stripe data.
                        </p>
                    </div>
                    <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                stripeStatus.status === "connected"
                                    ? "bg-emerald-400"
                                    : stripeStatus.status === "error"
                                        ? "bg-rose-400"
                                        : "bg-slate-400"
                            }`}
                        />
                        <span>{statusLabel}</span>
                    </div>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                    {stripeStatus.loading && (
                        <span>Checking Stripe status…</span>
                    )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "connected" &&
                        stripeStatus.hasStripeConnection && (
                            <span>
                                Stripe is connected for this tenant. Updating
                                the key will take effect for future runs.
                            </span>
                        )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "not_connected" && (
                            <span>
                                Stripe is not connected yet. Add a secret key
                                below to enable live data.
                            </span>
                        )}
                    {!stripeStatus.loading &&
                        stripeStatus.status === "error" && (
                            <span>
                                Could not verify Stripe status. You can still
                                try saving credentials, but check logs if
                                issues persist.
                            </span>
                        )}
                </div>

                <div className="mt-4 border-t border-slate-700/60 pt-4">
                    {!isTenantAdmin && (
                        <div className="rounded-lg border border-amber-500/60 bg-amber-900/30 px-3 py-2 text-xs text-amber-100">
                            You are logged in as <b>{user?.role}</b>. Only{" "}
                            <b>tenant admins</b> can update Stripe credentials.
                            Please ask your admin to configure this integration.
                        </div>
                    )}

                    {isTenantAdmin && (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 max-w-xl"
                        >
                            {error && (
                                <div className="rounded-lg border border-rose-500/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="rounded-lg border border-emerald-500/70 bg-emerald-950/60 px-3 py-2 text-xs text-emerald-100">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-100">
                                    Stripe secret key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) =>
                                        setApiKey(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    placeholder="sk_test_..."
                                />
                                <p className="text-xs text-slate-400">
                                    This is never shown back in the UI. Use a{" "}
                                    <b>test key</b> in non-production
                                    environments.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-100">
                                    Stripe account ID (optional)
                                </label>
                                <input
                                    type="text"
                                    value={accountId}
                                    onChange={(e) =>
                                        setAccountId(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    placeholder="acct_..."
                                />
                                <p className="text-xs text-slate-400">
                                    Only needed if you&apos;re using Connect or
                                    multiple Stripe accounts.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center rounded-lg border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Saving…"
                                        : stripeStatus.hasStripeConnection
                                            ? "Update Stripe key"
                                            : "Connect Stripe"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
