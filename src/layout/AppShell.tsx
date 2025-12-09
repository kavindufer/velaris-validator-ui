import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStripeStatus } from "../hooks/useStripeStatus";

function classNames(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(" ");
}

export default function AppShell() {
    const { user, logout } = useAuth();
    const { status: stripeStatus, loading: stripeLoading } = useStripeStatus();

    const stripeLabel =
        stripeStatus === "configured"
            ? "Stripe: configured"
            : stripeStatus === "not_configured"
                ? "Stripe: not configured"
                : stripeStatus === "error"
                    ? "Stripe: error"
                    : "Stripe: checking…";

    const stripeClasses = (() => {
        if (stripeLoading || stripeStatus === "unknown") {
            return "border-slate-600 bg-slate-900 text-slate-200";
        }
        if (stripeStatus === "configured") {
            return "border-emerald-500/60 bg-emerald-900/40 text-emerald-100";
        }
        if (stripeStatus === "error") {
            return "border-red-500/60 bg-red-900/40 text-red-100";
        }
        // not_configured
        return "border-amber-500/60 bg-amber-900/40 text-amber-100";
    })();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Top bar */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-sky-500/90" />
                        <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Velaris Validator
              </span>
                            <span className="text-xs text-slate-400">Operator UI</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
            <span
                className={classNames(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1",
                    "text-[11px] font-medium",
                    stripeClasses,
                )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {stripeLabel}
            </span>

                        {user && (
                            <span className="text-slate-300">
                {user.email}
                                {user.role && (
                                    <span className="text-slate-500"> ({user.role})</span>
                                )}
              </span>
                        )}
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Content area with nav */}
            <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
                <nav className="w-40 flex-shrink-0">
                    <ul className="space-y-1 text-sm">
                        <li>
                            <NavLink
                                to="/rules"
                                className={({ isActive }) =>
                                    classNames(
                                        "flex items-center justify-between rounded-md px-3 py-2 hover:bg-slate-800/70",
                                        isActive && "bg-slate-800 text-sky-300",
                                    )
                                }
                            >
                                <span>Rules</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/jobs"
                                className={({ isActive }) =>
                                    classNames(
                                        "flex items-center justify-between rounded-md px-3 py-2 hover:bg-slate-800/70",
                                        isActive && "bg-slate-800 text-sky-300",
                                    )
                                }
                            >
                                <span>Jobs</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <main className="flex-1 pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
