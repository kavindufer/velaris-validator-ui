import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./layout/AppShell";
import LoginPage from "./pages/LoginPage";
import RulesListPage from "./pages/RulesListPage";
import RuleDetailPage from "./pages/RuleDetailPage";
import RuleCreatePage from "./pages/RuleCreatePage";
import RuleEditPage from "./pages/RuleEditPage";
import JobsListPage from "./pages/JobsListPage";
import JobDetailPage from "./pages/JobDetailPage";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminTenantsPage from "./pages/admin/AdminTenantsPage";
import TenantDetailPage from "./pages/admin/TenantDetailPage";
import { AdminRoute } from "./components/routes/AdminRoute";

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-200">
                Checking session…
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Decides where to send the user when they hit "/"
function HomeRedirect() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === "SUPERADMIN") {
        return <Navigate to="/admin/overview" replace />;
    }

    return <Navigate to="/rules" replace />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                {/* default route depends on role */}
                <Route index element={<HomeRedirect />} />

                {/* tenant-scoped routes */}
                <Route path="rules" element={<RulesListPage />} />
                <Route path="rules/new" element={<RuleCreatePage />} />
                <Route path="rules/:ruleId/edit" element={<RuleEditPage />} />
                <Route path="rules/:ruleId" element={<RuleDetailPage />} />
                <Route path="jobs" element={<JobsListPage />} />
                <Route path="jobs/:jobId" element={<JobDetailPage />} />

                {/* admin-only routes */}
                <Route
                    path="admin/overview"
                    element={
                        <AdminRoute>
                            <AdminOverviewPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="admin/tenants"
                    element={
                        <AdminRoute>
                            <AdminTenantsPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="admin/tenants/:tenantId"
                    element={
                        <AdminRoute>
                            <TenantDetailPage />
                        </AdminRoute>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
