import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../utils/permissions";

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * Route guard that only allows SUPERADMIN users to access its children.
 */
export function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
                Checking admin permissions…
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!isPlatformAdmin(user)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
