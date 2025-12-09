// src/api/admin.ts
import { apiGet, apiPost, apiPut } from "./client";

/* ---------- Overview / tenant list / tenant metrics ---------- */

export interface AdminOverview {
    total_tenants: number;
    tenants_with_stripe: number;
    total_rules: number;
    jobs_last_24h: number;
    jobs_failed_last_24h: number;
}

export interface AdminTenantRow {
    id: string;
    name: string;
    has_stripe: boolean;
    has_velaris: boolean;
    rules_count: number;
    jobs_last_24h: number;
    jobs_failed_last_24h: number;
    latest_job_created_at: string | null;
}

export interface TenantSummary {
    id: string;
    name: string;
    has_stripe: boolean;
    has_velaris: boolean;
}

export interface TenantJob {
    id: string;
    status: string;
    run_type: string;
    created_at: string;
}

export interface TenantOverview {
    tenant: TenantSummary;
    rules_count: number;
    jobs_total: number;
    jobs_last_24h: number;
    jobs_failed_last_24h: number;
    latest_jobs: TenantJob[];
}

/* ---------- Tenant creation (SUPERADMIN) ---------- */

export interface CreateTenantPayload {
    tenant_name: string;
    admin_email: string;
}

export interface AdminTenantCreateResponse {
    tenant_id: string;
    tenant_name: string;
    admin_user_id: string;
    admin_email: string;
    admin_initial_password: string;
}

/* ---------- Velaris public connection (per-tenant) ---------- */

export type VelarisAuthType = "BASIC" | "BEARER";

export interface VelarisPublicConfig {
    is_configured: boolean;
    base_url: string | null;
    auth_type: VelarisAuthType | null;
    token_last4: string | null;
    updated_at: string | null;
}

export interface VelarisPublicConfigUpdate {
    base_url: string;
    auth_type: VelarisAuthType;
    /**
     * Raw secret to store (either a Basic token or a Bearer token).
     * Backend never returns this value; it only returns last4.
     */
    token: string;
}

/* ---------- Velaris internal token (per-tenant) ---------- */

export interface VelarisInternalTokenInfo {
    is_set: boolean;
    last4: string | null;
    updated_at: string | null;
}

/* ---------- API helpers ---------- */

export async function fetchAdminOverview(): Promise<AdminOverview> {
    return apiGet<AdminOverview>("/admin/overview");
}

export async function fetchAdminTenants(): Promise<AdminTenantRow[]> {
    return apiGet<AdminTenantRow[]>("/admin/tenants");
}

export async function fetchTenantOverview(
    tenantId: string,
): Promise<TenantOverview> {
    return apiGet<TenantOverview>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/overview`,
    );
}

export async function createTenant(
    payload: CreateTenantPayload,
): Promise<AdminTenantCreateResponse> {
    // apiPost is generic on the *response* type only
    return apiPost<AdminTenantCreateResponse>("/admin/tenants", payload);
}

export async function fetchVelarisPublicConfig(
    tenantId: string,
): Promise<VelarisPublicConfig> {
    return apiGet<VelarisPublicConfig>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/velaris-public`,
    );
}

export async function updateVelarisPublicConfig(
    tenantId: string,
    payload: VelarisPublicConfigUpdate,
): Promise<VelarisPublicConfig> {
    return apiPut<VelarisPublicConfig>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/velaris-public`,
        payload,
    );
}

export async function fetchVelarisInternalToken(
    tenantId: string,
): Promise<VelarisInternalTokenInfo> {
    return apiGet<VelarisInternalTokenInfo>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/velaris-internal-token`,
    );
}

export async function updateVelarisInternalToken(
    tenantId: string,
    token: string,
): Promise<VelarisInternalTokenInfo> {
    return apiPut<VelarisInternalTokenInfo>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/velaris-internal-token`,
        { token },
    );
}
