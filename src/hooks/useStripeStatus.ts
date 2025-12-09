import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type { IntegrationConnection } from "../types/api";
import { useAuth } from "../context/AuthContext";

export type StripeStatus = "unknown" | "configured" | "not_configured" | "error";

interface StripeStatusState {
    status: StripeStatus;
    loading: boolean;
    error: string | null;
}

export function useStripeStatus(): StripeStatusState {
    const { logout } = useAuth();
    const [status, setStatus] = useState<StripeStatus>("unknown");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const integrations = await apiGet<IntegrationConnection[]>("/integrations", {
                    onUnauthorized: () => {
                        if (!cancelled) logout();
                    },
                });

                if (cancelled) return;

                const hasStripe = integrations.some(
                    (i) => i.integration_type === "stripe",
                );

                setStatus(hasStripe ? "configured" : "not_configured");
            } catch (err) {
                if (!cancelled) {
                    setStatus("error");
                    const message =
                        err instanceof Error ? err.message : "Failed to load Stripe status";
                    setError(message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [logout]);

    return { status, loading, error };
}
