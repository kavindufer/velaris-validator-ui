import { apiPost } from "./client";
import type { IntegrationConnection } from "../types/api";

export interface StripeIntegrationCredentials {
    api_key: string;
    account_id?: string | null;
}

/**
 * Tenant-scoped: upsert Stripe integration for the **current** tenant.
 * Uses POST /integrations/stripe/connections
 */
export async function upsertStripeIntegration(
    creds: StripeIntegrationCredentials,
): Promise<IntegrationConnection> {
    return apiPost<IntegrationConnection>("/integrations/stripe/connections", {
        credentials: {
            api_key: creds.api_key,
            account_id: creds.account_id ?? null,
        },
    });
}

/**
 * Admin-scoped: upsert Stripe integration for a specific tenant.
 * Uses POST /admin/tenants/{tenant_id}/integrations/stripe/connections
 */
export async function adminUpsertTenantStripeIntegration(
    tenantId: string,
    creds: StripeIntegrationCredentials,
): Promise<IntegrationConnection> {
    return apiPost<IntegrationConnection>(
        `/admin/tenants/${encodeURIComponent(
            tenantId,
        )}/integrations/stripe/connections`,
        {
            credentials: {
                api_key: creds.api_key,
                account_id: creds.account_id ?? null,
            },
        },
    );
}
