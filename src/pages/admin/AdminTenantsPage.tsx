import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchAdminTenants,
    createTenant,
} from "../../api/admin";
import type {
    AdminTenantRow,
    AdminTenantCreateResponse,
} from "../../api/admin";

type LoadState = "idle" | "loading" | "error" | "success";

function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function AdminTenantsPage() {
    const [rows, setRows] = useState<AdminTenantRow[]>([]);
    const [search, setSearch] = useState("");
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);

    // create-tenant state
    const [createOpen, setCreateOpen] = useState(false);
    const [tenantName, setTenantName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createResult, setCreateResult] =
        useState<AdminTenantCreateResponse | null>(null);

    const navigate = useNavigate();

    async function loadTenants() {
        try {
            setState("loading");
            setError(null);
            const result = await fetchAdminTenants();
            setRows(result);
            setState("success");
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error ? err.message : "Failed to load tenants",
            );
            setState("error");
        }
    }

    useEffect(() => {
        void loadTenants();
    }, []);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (row) =>
                row.name.toLowerCase().includes(q) ||
                row.id.toLowerCase().includes(q),
        );
    }, [rows, search]);

    async function handleCreateTenant(e: React.FormEvent) {
        e.preventDefault();
        if (!tenantName.trim() || !adminEmail.trim()) {
            setCreateError("Tenant name and admin email are required.");
            return;
        }

        try {
            setCreating(true);
            setCreateError(null);
            setCreateResult(null);

            const payload = {
                tenant_name: tenantName.trim(),
                admin_email: adminEmail.trim(),
            };

            const result = await createTenant(payload);
            setCreateResult(result);

            // Clear form fields but keep panel open so you can still see the password
            setTenantName("");
            setAdminEmail("");

            // Refresh list
            void loadTenants();
        } catch (err) {
            console.error(err);
            setCreateError(
                err instanceof Error
                    ? err.message
                    : "Failed to create tenant. Please try again.",
            );
        } finally {
            setCreating(false);
        }
    }

    function resetCreatePanel() {
        setCreateOpen(false);
        setCreateError(null);
        setCreateResult(null);
        setTenantName("");
        setAdminEmail("");
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            {/* Header + actions */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-50">Tenants</h1>
                    <p className="text-sm text-slate-400">
                        All tenants with quick health signals for Stripe and Velaris
                        connections.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        type="search"
                        placeholder="Search by name or ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />

                    <button
                        type="button"
                        onClick={() => {
                            if (!createOpen) {
                                setCreateOpen(true);
                            } else if (!creating) {
                                // allow closing only when not in the middle of a request
                                resetCreatePanel();
                            }
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-50 shadow hover:bg-emerald-500 disabled:opacity-60"
                        disabled={creating}
                    >
                        {createOpen ? "Close create tenant" : "Create tenant"}
                    </button>
                </div>
            </div>

            {/* Create tenant panel */}
            {createOpen && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h2 className="text-sm font-semibold text-slate-100">
                        Create tenant
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                        SUPERADMIN creates the tenant and an initial tenant admin user.
                        The initial password is shown{" "}
                        <span className="font-semibold">only once</span> below after
                        creation.
                    </p>

                    <form
                        onSubmit={handleCreateTenant}
                        className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)]"
                    >
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Tenant name
                            </label>
                            <input
                                type="text"
                                value={tenantName}
                                onChange={(e) => setTenantName(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Acme Corp"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-300">
                                Admin email
                            </label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="admin@acme.com"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-50 shadow hover:bg-emerald-500 disabled:opacity-60"
                            >
                                {creating ? "Creating…" : "Create tenant"}
                            </button>
                        </div>
                    </form>

                    {createError && (
                        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                            {createError}
                        </div>
                    )}

                    {createResult && (
                        <div className="mt-4 rounded-lg border border-emerald-600/50 bg-emerald-950/40 px-3 py-3 text-xs text-emerald-50">
                            <div className="font-semibold">
                                Tenant <span className="font-mono">{createResult.tenant_name}</span>{" "}
                                created.
                            </div>
                            <div className="mt-1 text-emerald-100">
                                Initial admin user:{" "}
                                <span className="font-mono">{createResult.admin_email}</span>
                            </div>
                            <div className="mt-2">
                                Initial password (copy now – it will not be shown again):
                            </div>
                            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <code className="inline-flex items-center rounded bg-slate-900 px-2 py-1 text-[11px]">
                                    {createResult.admin_initial_password}
                                </code>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error banner for main list */}
            {state === "error" && error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    Failed to load tenants: {error}
                </div>
            )}

            {/* Tenants table */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-3 py-2 text-left">Tenant name</th>
                        <th className="px-3 py-2 text-left">Tenant ID</th>
                        <th className="px-3 py-2 text-left">Stripe</th>
                        <th className="px-3 py-2 text-left">Velaris</th>
                        <th className="px-3 py-2 text-right">Jobs (24h)</th>
                        <th className="px-3 py-2 text-right">Failed (24h)</th>
                        <th className="px-3 py-2 text-left">Latest job</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {filteredRows.map((row) => (
                        <tr
                            key={row.id}
                            className="cursor-pointer hover:bg-slate-900"
                            onClick={() =>
                                navigate(`/admin/tenants/${encodeURIComponent(row.id)}`)
                            }
                        >
                            <td className="px-3 py-2 text-slate-100">{row.name}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">
                                {row.id}
                            </td>
                            <td className="px-3 py-2">
                  <span
                      className={classNames(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.has_stripe
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/60"
                              : "bg-slate-900 text-slate-400 border border-slate-700/60",
                      )}
                  >
                    {row.has_stripe ? "Connected" : "Not connected"}
                  </span>
                            </td>
                            <td className="px-3 py-2">
                  <span
                      className={classNames(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.has_velaris
                              ? "bg-sky-950/60 text-sky-300 border border-sky-700/60"
                              : "bg-slate-900 text-slate-400 border border-slate-700/60",
                      )}
                  >
                    {row.has_velaris ? "Connected" : "Not connected"}
                  </span>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-100">
                                {row.jobs_last_24h}
                            </td>
                            <td
                                className={classNames(
                                    "px-3 py-2 text-right",
                                    row.jobs_failed_last_24h > 0
                                        ? "text-red-300"
                                        : "text-slate-200",
                                )}
                            >
                                {row.jobs_failed_last_24h}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-400">
                                {row.latest_job_created_at
                                    ? new Date(row.latest_job_created_at).toLocaleString()
                                    : "—"}
                            </td>
                        </tr>
                    ))}

                    {filteredRows.length === 0 && state === "success" && (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-3 py-6 text-center text-sm text-slate-400"
                            >
                                No tenants match this filter.
                            </td>
                        </tr>
                    )}

                    {state === "loading" && (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-3 py-6 text-center text-sm text-slate-400"
                            >
                                Loading tenants…
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
