export type UserRole = "ADMIN" | "VIEWER" | string;

export interface SimpleValidationRule {
    source: string;
    metric: "count" | "sum" | string;
    field?: string | null;
    filter?: string | null;
}

export type RuleStatus = "draft" | "verified" | "active" | string;

export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    mapping_id: string | null;
    status: RuleStatus;
    dsl: SimpleValidationRule;
    created_at: string;
    updated_at: string;
}

export type JobStatus =
    | "pending"
    | "running"
    | "success"
    | "failed"
    | string;

export type RunType = "preview" | "full" | string;

export interface ValidationJobSummary {
    summary_version?: number;
    source?: string;
    metric?: string;
    field?: string | null;
    filter?: string | null;
    value?: number;
    rows_scanned?: number;
    rows_matched?: number;
    run_type?: RunType;
    duration_ms?: number;
    backing_source?: "stripe_live" | "sample_data" | string;
    stripe_invoice_count?: number;
    preview_rows?: Array<Record<string, unknown>> | null;
    [key: string]: unknown;
}

export interface ValidationJob {
    id: string;
    validation_rule_id: string;
    tenant_id: string;
    run_type: RunType;
    status: JobStatus;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    summary: ValidationJobSummary | null;
    error_message: string | null;
}

export interface IntegrationConnection {
    id: string;
    integration_type: string;
    created_at: string;
    updated_at: string;
}
