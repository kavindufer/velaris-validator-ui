import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStripeStatus } from "../hooks/useStripeStatus";
import { isPlatformAdmin } from "../utils/permissions";

function tabClass(isActive: boolean) {
    return [
        "border-b-2 pb-1 text-sm",
        isActive
            ? "border-sky-400 text-sky-100"
            : "border-transparent text-slate-400 hover:text-slate-200",
    ].join(" ");
}

function adminTabClass(isActive: boolean) {
    return [
        "border-b-2 pb-1 text-sm",
        isActive
            ? "border-emerald-400 text-emerald-100"
            : "border-transparent text-slate-400 hover:text-slate-200",
    ].join(" ");
}

export default function AppShell() {
    const { user, logout } = useAuth();
    const { status, loading } = useStripeStatus();
    const isSuperadmin = isPlatformAdmin(user);

    const stripeLabel = loading
        ? "Stripe: checking…"
        : status === "configured"
            ? "Stripe: configured"
            : status === "error"
                ? "Stripe: error"
                : "Stripe: not configured";

    const stripeClasses = loading
        ? "border-slate-500 text-slate-300"
        : status === "configured"
            ? "border-emerald-500 text-emerald-300"
            : status === "error"
                ? "border-rose-500 text-rose-300"
                : "border-amber-500 text-amber-300";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Top bar */}
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/90 text-slate-950 shadow">
                            <span className="text-sm font-bold">VV</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-tight">
                                Velaris Validator
                            </span>
                            <span className="text-[11px] text-slate-400">
                                {isSuperadmin ? "Operator UI" : "Tenant workspace"}
                            </span>
                        </div>
                    </div>

                    {/* Right side: Stripe & user */}
                    <div className="flex items-center gap-4">
                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${stripeClasses}`}
                        >
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                            {stripeLabel}
                        </span>

                        {user && (
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex flex-col items-end">
                                    <span className="font-medium text-slate-100">
                                        {user.email}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                        {user.role ?? "UNKNOWN"}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-50 hover:bg-slate-700"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main navigation */}
                <div className="border-t border-slate-800">
                    <div className="mx-auto flex max-w-6xl items-center px-6">
                        <nav className="flex gap-4 py-2">
                            {isSuperadmin ? (
                                // SUPERADMIN – operator navigation only
                                <>
                                    <NavLink
                                        to="/admin/overview"
                                        className={({ isActive }) => adminTabClass(isActive)}
                                    >
                                        Overview
                                    </NavLink>
                                    <NavLink
                                        to="/admin/tenants"
                                        className={({ isActive }) => adminTabClass(isActive)}
                                    >
                                        Tenants
                                    </NavLink>
                                </>
                            ) : (
                                // Tenant operators – rules / jobs only
                                <>
                                    <NavLink
                                        to="/rules"
                                        className={({ isActive }) => tabClass(isActive)}
                                    >
                                        Rules
                                    </NavLink>
                                    <NavLink
                                        to="/jobs"
                                        className={({ isActive }) => tabClass(isActive)}
                                    >
                                        Jobs
                                    </NavLink>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-6xl px-6 py-6">
                <Outlet />
            </main>
        </div>
    );
}
