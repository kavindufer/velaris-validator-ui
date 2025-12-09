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
    const { user, login, loading } = useAuth();

    // Typed location state instead of `as any`
    const location = useLocation() as { state?: LocationState };
    const from = location.state?.from?.pathname ?? "/";

    const [email, setEmail] = useState("demo@tenant.local");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
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

                    {error && (
                        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || loading}
                        className="w-full rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting || loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

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
