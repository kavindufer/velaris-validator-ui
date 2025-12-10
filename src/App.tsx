import { Navigate, Route, Routes } from "react-router-dom";

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

import DvTasksListPage from "./pages/DvTasksListPage";
import DvTaskDetailPage from "./pages/DvTaskDetailPage";
import DvTaskNewPage from "./pages/DvTaskNewPage";


import ProtectedRoute from "./components/ProtectedRoute";
import { AdminRoute } from "./components/routes/AdminRoute";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === "SUPERADMIN") {
        return <Navigate to="/admin/overview" replace />;
    }

    // Tenant admins / viewers
    return <Navigate to="/rules" replace />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* All authenticated routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppShell />}>
                    {/* Default route depends on role */}
                    <Route index element={<HomeRedirect />} />

                    {/* Tenant-scoped routes */}
                    <Route path="rules" element={<RulesListPage />} />
                    <Route path="rules/new" element={<RuleCreatePage />} />
                    <Route path="rules/:ruleId/edit" element={<RuleEditPage />} />
                    <Route path="rules/:ruleId" element={<RuleDetailPage />} />
                    <Route path="jobs" element={<JobsListPage />} />
                    <Route path="jobs/:jobId" element={<JobDetailPage />} />

                    {/* DV Tasks (Sprint 9) */}
                    <Route path="dv-tasks" element={<DvTasksListPage />} />
                    <Route path="dv-tasks/new" element={<DvTaskNewPage />} />
                    <Route path="dv-tasks/:taskId" element={<DvTaskDetailPage />} />

                    {/* Admin routes (SUPERADMIN only) */}
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
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
