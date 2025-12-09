import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FullPageSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
            <div className="animate-pulse text-sm text-slate-300">Loading session…</div>
        </div>
    );
}

/**
 * Wraps all authenticated routes.
 * - Shows a full-page spinner while hydrating session
 * - Redirects unauthenticated users to /login
 * - Otherwise renders nested routes via <Outlet />
 */
export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <FullPageSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
