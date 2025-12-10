import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
    fetchTenantOverview,
    fetchVelarisPublicConfig,
    fetchVelarisInternalToken,
    updateVelarisPublicConfig,
    updateVelarisInternalToken,
} from "../../api/admin";
import type {
    TenantOverview,
    VelarisPublicConfig,
    VelarisInternalTokenInfo,
    VelarisAuthType,
} from "../../api/admin";
import { adminUpsertTenantStripeIntegration } from "../../api/integrations";

type LoadState = "idle" | "loading" | "error" | "success";

export default function TenantDetailPage() {
    const { tenantId } = useParams<"tenantId">();

    const [data, setData] = useState<TenantOverview | null>(null);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    // Admin Stripe helper
    const [stripeKey, setStripeKey] = useState("");
    const [stripeAccountId, setStripeAccountId] = useState("");
    const [savingStripe, setSavingStripe] = useState(false);
    const [stripeAdminError, setStripeAdminError] = useState<string | null>(null);
    const [stripeAdminSuccess, setStripeAdminSuccess] = useState<string | null>(
        null,
    );

    // Velaris public config
    const [velarisPublic, setVelarisPublic] =
        useState<VelarisPublicConfig | null>(null);
    const [vpState, setVpState] = useState<LoadState>("idle");
    const [vpError, setVpError] = useState<string | null>(null);
    const [vpBaseUrl, setVpBaseUrl] = useState(
        "https://ua4t4so3ba.execute-api.eu-west-2.amazonaws.com/prod",
    );
    const [vpAuthType, setVpAuthType] = useState<VelarisAuthType>("BEARER");
    const [vpToken, setVpToken] = useState("");
    const [vpSaving, setVpSaving] = useState(false);

    // Velaris internal token
    const [viInfo, setViInfo] =
        useState<VelarisInternalTokenInfo | null>(null);
    const [viState, setViState] = useState<LoadState>("idle");
    const [viError, setViError] = useState<string | null>(null);
    const [viToken, setViToken] = useState("");
    const [viSaving, setViSaving] = useState(false);

    async function loadOverview(id: string) {
        try {
            setState("loading");
            setError(null);
            const result = await fetchTenantOverview(id);
            setData(result);
            setState("success");
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error ? err.message : "Failed to load tenant",
            );
            setState("error");
        }
    }

    async function loadVelarisPublic(id: string) {
        try {
            setVpState("loading");
            setVpError(null);

            const cfg = await fetchVelarisPublicConfig(id);
            setVelarisPublic(cfg);

            if (cfg.base_url) {
                setVpBaseUrl(cfg.base_url);
            }
            if (cfg.auth_type) {
                setVpAuthType(cfg.auth_type);
            }

            setVpState("success");
        } catch (err) {
            console.error(err);

            // If the endpoint doesn't exist yet or returns 404,
            // just treat it as "not configured".
            if (err instanceof ApiError && err.status === 404) {
                setVelarisPublic({
                    is_configured: false,
                    base_url: vpBaseUrl,
                    auth_type: vpAuthType,
                    token_last4: null,
                    updated_at: null,
                });
                setVpState("success");
                setVpError(null);
                return;
            }

            setVpError(
                err instanceof Error
                    ? err.message
                    : "Failed to load Velaris public config",
            );
            setVpState("error");
        }
    }

    async function loadVelarisInternal(id: string) {
        try {
            setViState("loading");
            setViError(null);
            const info = await fetchVelarisInternalToken(id);
            setViInfo(info);
            setViState("success");
        } catch (err) {
            console.error(err);
            setViError(
                err instanceof Error
                    ? err.message
                    : "Failed to load Velaris internal token info",
            );
            setViState("error");
        }
    }

    useEffect(() => {
        if (tenantId) {
            void loadOverview(tenantId);
            void loadVelarisPublic(tenantId);
            void loadVelarisInternal(tenantId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId]);

    if (!tenantId) {
        return (
            <div className="p-6 text-sm text-red-300">
                No tenant ID in route. This should not happen.
            </div>
        );
    }

    const tenant = data?.tenant;

    async function handleSaveVelarisPublic(e: React.FormEvent) {
        e.preventDefault();
        if (!tenantId) return;
        if (!vpBaseUrl.trim() || !vpToken.trim()) {
            setVpError("Base URL and token are required.");
            return;
        }

        try {
            setVpSaving(true);
            setVpError(null);
            const updated = await updateVelarisPublicConfig(tenantId, {
                base_url: vpBaseUrl.trim(),
                auth_type: vpAuthType,
                token: vpToken.trim(),
            });
            setVelarisPublic(updated);
            setVpToken("");
        } catch (err) {
            console.error(err);
            setVpError(
                err instanceof Error
                    ? err.message
                    : "Failed to save Velaris public config",
            );
        } finally {
            setVpSaving(false);
        }
    }

    async function handleSaveVelarisInternal(e: React.FormEvent) {
        e.preventDefault();
        if (!tenantId) return;
        if (!viToken.trim()) {
            setViError("Internal token is required.");
            return;
        }

        try {
            setViSaving(true);
            setViError(null);
            const updated = await updateVelarisInternalToken(
                tenantId,
                viToken.trim(),
            );
            setViInfo(updated);
            setViToken("");
        } catch (err) {
            console.error(err);
            setViError(
                err instanceof Error
                    ? err.message
                    : "Failed to save Velaris internal token",
            );
        } finally {
            setViSaving(false);
        }
    }

    const handleAdminStripeSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;

        setStripeAdminError(null);
        setStripeAdminSuccess(null);

        if (!stripeKey.trim()) {
            setStripeAdminError("Stripe secret key is required.");
            return;
        }

        setSavingStripe(true);
        try {
            await adminUpsertTenantStripeIntegration(tenantId, {
                api_key: stripeKey.trim(),
                account_id: stripeAccountId.trim() || null,
            });
            setStripeAdminSuccess("Stripe credentials updated for this tenant.");
            setStripeKey("");
            setStripeAccountId("");
            // Refresh overview so has_stripe reflects latest state
            void loadOverview(tenantId);
        } catch (err) {
            console.error("Failed to save tenant Stripe credentials", err);
            if (err instanceof ApiError) {
                setStripeAdminError(
                    `Failed to save Stripe credentials (${err.status}): ${err.message}`,
                );
            } else if (err instanceof Error) {
                setStripeAdminError(err.message);
            } else {
                setStripeAdminError(
                    "Failed to save Stripe credentials. Check logs.",
                );
            }
        } finally {
            setSavingStripe(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="mb-1 text-xs text-slate-500">
                        <Link
                            to="/admin/tenants"
                            className="text-sky-400 hover:underline"
                        >
                            ← Back to tenants
                        </Link>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-50">
                        {tenant?.name ?? "Tenant details"}
                    </h1>
                    <p className="font-mono text-sm text-slate-400">
                        {tenant?.id ?? tenantId}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span
                            className={
                                tenant?.has_stripe
                                    ? "inline-flex items-center rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2 py-0.5 text-emerald-200"
                                    : "inline-flex items-center rounded-full border border-slate-700/50 bg-slate-900 px-2 py-0.5 text-slate-300"
                            }
                        >
                            Stripe:{" "}
                            {tenant?.has_stripe ? "Connected" : "Not connected"}
                        </span>
                        <span
                            className={
                                tenant?.has_velaris
                                    ? "inline-flex items-center rounded-full border border-sky-700/50 bg-sky-950/60 px-2 py-0.5 text-sky-200"
                                    : "inline-flex items-center rounded-full border border-slate-700/50 bg-slate-900 px-2 py-0.5 text-slate-300"
                            }
                        >
                            Velaris:{" "}
                            {tenant?.has_velaris
                                ? "Connected"
                                : "Not connected"}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (!tenantId) return;
                        void loadOverview(tenantId);
                        void loadVelarisPublic(tenantId);
                        void loadVelarisInternal(tenantId);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
                >
                    Refresh
                </button>
            </div>

            {state === "error" && error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    Failed to load tenant: {error}
                </div>
            )}

            {!data && state === "loading" && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                    Loading tenant overview…
                </div>
            )}

            {/* Metrics + recent jobs */}
            {data && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    {/* Metrics card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <h2 className="text-sm font-semibold text-slate-100">
                            Metrics (last 24h)
                        </h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Rules</dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.rules_count}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">Jobs total</dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.jobs_total}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">
                                    Jobs (last 24h)
                                </dt>
                                <dd className="font-semibold text-slate-100">
                                    {data.jobs_last_24h}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-slate-400">
                                    Failed (last 24h)
                                </dt>
                                <dd
                                    className={
                                        data.jobs_failed_last_24h > 0
                                            ? "font-semibold text-red-300"
                                            : "font-semibold text-slate-100"
                                    }
                                >
                                    {data.jobs_failed_last_24h}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Recent jobs */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-100">
                                Recent jobs
                            </h2>
                            <span className="text-xs text-slate-500">
                                Showing up to {data.latest_jobs.length} jobs
                            </span>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        Job ID
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Run type
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                        Created at
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {data.latest_jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td className="px-3 py-2 font-mono text-xs text-sky-300">
                                            <Link
                                                to={`/jobs/${encodeURIComponent(
                                                    job.id,
                                                )}`}
                                                className="hover:underline"
                                            >
                                                {job.id}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">
                                                <span
                                                    className={
                                                        job.status === "failed"
                                                            ? "inline-flex rounded-full border border-red-600/60 bg-red-950/60 px-2 py-0.5 text-xs font-medium text-red-200"
                                                            : "inline-flex rounded-full border border-emerald-600/60 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-200"
                                                    }
                                                >
                                                    {job.status}
                                                </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-200">
                                            {job.run_type}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-400">
                                            {new Date(
                                                job.created_at,
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {data.latest_jobs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-3 py-6 text-center text-sm text-slate-400"
                                        >
                                            No recent jobs for this tenant.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Stripe helper */}
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                    Stripe credentials (admin helper)
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    Set or update Stripe credentials for this tenant from the
                    platform side. Tenant admins can also manage their own keys
                    from the Integrations page in their workspace.
                </p>

                {stripeAdminError && (
                    <div className="mt-3 rounded-lg border border-red-500/50 bg-red-950/60 px-3 py-2 text-xs text-red-100">
                        {stripeAdminError}
                    </div>
                )}
                {stripeAdminSuccess && (
                    <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-950/60 px-3 py-2 text-xs text-emerald-100">
                        {stripeAdminSuccess}
                    </div>
                )}

                <form
                    onSubmit={handleAdminStripeSave}
                    className="mt-3 grid gap-3 md:grid-cols-3"
                >
                    <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-medium text-slate-200">
                            Stripe secret key
                        </label>
                        <input
                            type="password"
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="sk_test_..."
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-200">
                            Stripe account ID (optional)
                        </label>
                        <input
                            type="text"
                            value={stripeAccountId}
                            onChange={(e) =>
                                setStripeAccountId(e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="acct_..."
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={savingStripe}
                            className="inline-flex items-center rounded-lg border border-sky-500 bg-sky-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {savingStripe
                                ? "Saving…"
                                : "Save Stripe credentials"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Velaris configuration */}
            <section className="mt-4 grid gap-4 md:grid-cols-2">
                {/* Velaris public */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify_between gap-2">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-100">
                                Velaris public API
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                                Configure the tenant&apos;s Velaris public API
                                connection (Basic or Bearer token).
                            </p>
                        </div>
                        <span
                            className={
                                velarisPublic?.is_configured
                                    ? "inline-flex rounded-full border border-sky-600/60 bg-sky-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-200"
                                    : "inline-flex rounded-full border border-slate-700/60 bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300"
                            }
                        >
                            {velarisPublic?.is_configured
                                ? "Configured"
                                : "Not configured"}
                        </span>
                    </div>

                    {vpState === "error" && vpError && (
                        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                            {vpError}
                        </div>
                    )}

                    <form
                        onSubmit={handleSaveVelarisPublic}
                        className="mt-3 space-y-3 text-sm"
                    >
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Base URL
                            </label>
                            <input
                                type="url"
                                value={vpBaseUrl}
                                onChange={(e) =>
                                    setVpBaseUrl(e.target.value)
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Auth type
                            </label>
                            <select
                                value={vpAuthType}
                                onChange={(e) =>
                                    setVpAuthType(
                                        e.target.value as VelarisAuthType,
                                    )
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="BEARER">Bearer token</option>
                                <option value="BASIC">Basic token</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Token
                            </label>
                            <input
                                type="password"
                                value={vpToken}
                                onChange={(e) => setVpToken(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder={
                                    vpAuthType === "BEARER"
                                        ? "Paste Velaris Bearer token…"
                                        : "Paste Basic token (base64 username:password)…"
                                }
                            />
                            {velarisPublic?.token_last4 && (
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Currently stored token ends with{" "}
                                    <span className="font-mono">
                                        ••••{velarisPublic.token_last4}
                                    </span>
                                    .
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={vpSaving}
                            className="mt-1 inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-sky-50 hover:bg-sky-500 disabled:opacity-60"
                        >
                            {vpSaving
                                ? "Saving…"
                                : "Save Velaris public config"}
                        </button>
                    </form>
                </div>

                {/* Velaris internal */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-100">
                                Velaris internal token
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                                Optional internal-only token for bulk Velaris
                                operations.
                            </p>
                        </div>
                        <span
                            className={
                                viInfo?.is_set
                                    ? "inline-flex rounded_full border border-emerald-600/60 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200"
                                    : "inline-flex rounded_full border border-slate-700/60 bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300"
                            }
                        >
                            {viInfo?.is_set ? "Configured" : "Not configured"}
                        </span>
                    </div>

                    {viState === "error" && viError && (
                        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                            {viError}
                        </div>
                    )}

                    <div className="mt-2 text-xs text-slate-400">
                        {viInfo?.is_set ? (
                            <>
                                Token is stored securely. We never show the full
                                value – only the last 4 characters.
                                <br />
                                Current token ends with{" "}
                                <span className="font-mono">
                                    ••••{viInfo.last4 ?? "????"}
                                </span>
                                {viInfo.updated_at && (
                                    <>
                                        {" "}
                                        (updated{" "}
                                        {new Date(
                                            viInfo.updated_at,
                                        ).toLocaleString()}
                                        ).
                                    </>
                                )}
                            </>
                        ) : (
                            <>No internal token configured yet.</>
                        )}
                    </div>

                    <form
                        onSubmit={handleSaveVelarisInternal}
                        className="mt-3 space-y-3 text-sm"
                    >
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Internal token
                            </label>
                            <input
                                type="password"
                                value={viToken}
                                onChange={(e) => setViToken(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Paste internal Velaris token…"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={viSaving}
                            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 hover:bg-emerald-500 disabled:opacity-60"
                        >
                            {viSaving ? "Saving…" : "Save internal token"}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
