// src/pages/LoginPage.tsx
import type { FormEvent } from "react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

type LocationState = {
    from?: {
        pathname?: string;
    };
};

export default function LoginPage() {
    const { user, login, loading, devBootstrapLogin } = useAuth();

    // Typed location state instead of `as any`
    const location = useLocation() as { state?: LocationState };
    const from = location.state?.from?.pathname ?? "/";

    const [email, setEmail] = useState("demo@tenant.local");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [devError, setDevError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [devBootstrapping, setDevBootstrapping] = useState(false);

    if (user) {
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setDevError(null);
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unexpected error during login");
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDevBootstrapClick() {
        setError(null);
        setDevError(null);
        setDevBootstrapping(true);
        try {
            await devBootstrapLogin();
            // On success, AuthContext will set user and router will redirect
        } catch (err) {
            if (err instanceof ApiError) {
                setDevError(err.message);
            } else if (err instanceof Error) {
                setDevError(err.message);
            } else {
                setDevError("Unexpected error during dev bootstrap");
            }
        } finally {
            setDevBootstrapping(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-8 shadow-lg">
                <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Velaris Validator
                </h1>
                <p className="text-sm text-slate-300 mb-6">
                    Sign in to access rules and jobs. This will call{" "}
                    <code className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded">
                        POST /auth/login
                    </code>{" "}
                    and{" "}
                    <code className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded">
                        GET /auth/me
                    </code>
                    .
                </p>

                {(error || devError) && (
                    <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        {error ?? devError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-200">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-200">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || loading || devBootstrapping}
                        className="w-full rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting || loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleDevBootstrapClick}
                    disabled={submitting || loading || devBootstrapping}
                    className="mt-3 w-full rounded-lg border border-sky-500/60 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-sky-100 hover:bg-sky-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {devBootstrapping || loading
                        ? "Bootstrapping dev tenant…"
                        : "Dev: Create tenant & sign in"}
                </button>

                <p className="mt-2 text-[11px] text-slate-500">
                    Dev helper: calls{" "}
                    <code className="font-mono">/auth/dev/bootstrap</code>. Requires{" "}
                    <code className="font-mono">ENABLE_DEV_AUTH_BOOTSTRAP=1</code> on the
                    backend.
                </p>

                <p className="mt-4 text-[11px] text-slate-500">
                    Backend base URL:{" "}
                    <code className="font-mono">
                        {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}
                    </code>
                </p>
            </div>
        </div>
    );
}
