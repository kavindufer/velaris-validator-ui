import { apiGet } from "./client";

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
