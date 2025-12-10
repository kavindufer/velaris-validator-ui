// src/hooks/useStripeStatus.ts
import { useEffect, useState } from "react";
import { ApiError, apiGet } from "../api/client";
import { useAuth } from "../context/AuthContext";

export type StripeConnectionStatus =
    | "unknown"
    | "connected"
    | "not_connected"
    | "error";

export interface StripeStatusState {
    /** true while we’re checking integrations */
    loading: boolean;
    /** high-level status for UI badges etc */
    status: StripeConnectionStatus;
    /** convenience flag for “Stripe is connected” */
    hasStripeConnection: boolean;
    /** friendly error message (if any) */
    error: string | null;
}

/**
 * Small hook that answers “does this tenant have a Stripe integration?”
 * and exposes status + loading for top-level UI.
 */
export function useStripeStatus(): StripeStatusState {
    const { token } = useAuth();

    const [state, setState] = useState<StripeStatusState>({
        loading: true,
        status: "unknown",
        hasStripeConnection: false,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        // If we don’t have a token yet, don’t hammer the API.
        if (!token) {
            setState((prev) => ({
                ...prev,
                loading: false,
                status: "unknown",
                hasStripeConnection: false,
                error: null,
            }));
            return;
        }

        const load = async () => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const integrations = await apiGet<unknown[]>("/integrations");
                if (cancelled) return;

                const hasStripeConnection = Array.isArray(integrations)
                    ? integrations.some((item) => {
                        if (!item || typeof item !== "object") return false;
                        const maybe = item as { integration_type?: unknown };
                        return maybe.integration_type === "stripe";
                    })
                    : false;

                setState({
                    loading: false,
                    status: hasStripeConnection ? "connected" : "not_connected",
                    hasStripeConnection,
                    error: null,
                });
            } catch (err) {
                if (cancelled) return;

                console.error("Failed to load Stripe status", err);

                const message =
                    err instanceof ApiError
                        ? err.message
                        : "Failed to load Stripe status";

                setState({
                    loading: false,
                    status: "error",
                    hasStripeConnection: false,
                    error: message,
                });
            }
        };

        // explicitly ignore the returned promise (fixes lint warning)
        void load();

        return () => {
            cancelled = true;
        };
    }, [token]);

    return state;
}
