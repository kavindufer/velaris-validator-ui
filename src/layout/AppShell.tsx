import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function classNames(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(" ");
}

export default function AppShell() {
    const { user, logout } = useAuth();

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

                    <div className="flex items-center gap-4 text-xs">
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
