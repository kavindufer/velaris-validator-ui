import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import JobDetailPage from "./pages/JobDetailPage";
import JobsListPage from "./pages/JobsListPage";
import LoginPage from "./pages/LoginPage";
import RuleDetailPage from "./pages/RuleDetailPage";
import RulesListPage from "./pages/RulesListPage";

function AppShell() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-sky-500/20 ring-1 ring-sky-400/40 flex items-center justify-center text-xs font-bold text-sky-200">
                            VV
                        </div>
                        <div>
                            <div className="text-sm font-semibold tracking-tight">
                                Velaris Validator
                            </div>
                            <div className="text-[11px] text-slate-400">
                                Operator UI · Sprint 5
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                        {user && (
                            <span className="hidden sm:inline text-slate-400">
                Signed in as{" "}
                                <span className="font-mono text-[11px] text-slate-200">
                  {user.email}
                </span>
              </span>
                        )}
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs hover:border-slate-400"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-6xl gap-4 px-4 py-4">
                <nav className="w-40 shrink-0">
                    <ul className="space-y-1 text-sm">
                        <li>
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition",
                                        isActive
                                            ? "bg-slate-800 text-slate-50"
                                            : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
                                    ].join(" ")
                                }
                            >
                                <span>Overview</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/rules"
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition",
                                        isActive
                                            ? "bg-slate-800 text-slate-50"
                                            : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
                                    ].join(" ")
                                }
                            >
                                <span>Rules</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/jobs"
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition",
                                        isActive
                                            ? "bg-slate-800 text-slate-50"
                                            : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
                                    ].join(" ")
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

function OverviewPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-slate-300">
                Starting shell for the Velaris Validator Operator UI. Sprint 5 will
                connect this to your FastAPI backend for real rules and jobs.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Next steps
                    </div>
                    <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                        <li>Wire rules list to GET /validation-rules.</li>
                        <li>
                            Wire jobs list/detail to GET /validation-jobs and
                            GET /validation-jobs/{"{job_id}"}.
                        </li>
                        <li>
                            Show backing_source and preview_rows in job detail from
                            summary_json.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppShell />}>
                    <Route index element={<OverviewPage />} />
                    <Route path="rules" element={<RulesListPage />} />
                    <Route path="rules/:ruleId" element={<RuleDetailPage />} />
                    <Route path="jobs" element={<JobsListPage />} />
                    <Route path="jobs/:jobId" element={<JobDetailPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
