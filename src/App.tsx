// src/App.tsx
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./layout/AppShell";
import LoginPage from "./pages/LoginPage";
import RulesListPage from "./pages/RulesListPage";
import RuleDetailPage from "./pages/RuleDetailPage";
import JobsListPage from "./pages/JobsListPage";
import JobDetailPage from "./pages/JobDetailPage";

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
                <Route index element={<Navigate to="/rules" replace />} />
                <Route path="rules" element={<RulesListPage />} />
                <Route path="rules/:ruleId" element={<RuleDetailPage />} />
                <Route path="jobs" element={<JobsListPage />} />
                <Route path="jobs/:jobId" element={<JobDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
