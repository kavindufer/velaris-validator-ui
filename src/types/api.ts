// --- Auth / users ---

export type UserRole = "ADMIN" | "VIEWER" | string;

// --- Validation rules DSL ---

export interface SimpleValidationRule {
    source: string; // e.g. "invoices" | "customers"
    metric: string; // e.g. "count", "sum", "avg"
    field?: string | null;
    filter?: string | null;
    // future extensibility
    [key: string]: unknown;
}

// Rule lifecycle
export type RuleStatus = "draft" | "verified" | "active" | string;

// Scheduler types (Sprint 8)
export type RuleScheduleType = "manual" | "daily" | "weekly";

// Join helper metadata
export interface JoinHint {
    velaris_field: string;
    source_field: string;
    description?: string | null;
}

// Core validation rule coming from the API
export interface ValidationRule {
    id: string;
    name: string;
    description: string | null;
    mapping_id: string | null;
    status: RuleStatus;
    dsl: SimpleValidationRule;

    created_at: string;
    updated_at: string;

    // archival
    is_archived?: boolean;
    archived_at: string | null;
    archived_by_user_id: string | null;

    // Discovery + Architect metadata (Sprint 8)
    velaris_object?: string | null; // e.g. "invoice", "account"
    source_system?: string | null; // e.g. "stripe"
    source_resource?: string | null; // e.g. "invoices", "customers"
    join_hint?: JoinHint | null;

    schedule_type?: RuleScheduleType; // "manual" | "daily" | "weekly"
    next_scheduled_run_at?: string | null; // ISO datetime
}

// --- Validation jobs ---

export type JobStatus = "pending" | "running" | "success" | "failed" | string;
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

    // For richer previews / future inspection
    stripe_invoice_count?: number;
    preview_rows?: Array<Record<string, unknown>> | null;

    // allow backend to add extra keys without breaking the UI
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

    archived_at: string | null;
    archived_by_user_id: string | null;
}

// --- Integrations ---

export interface IntegrationConnection {
    id: string;
    tenant_id: string;
    provider: string; // e.g. "stripe"
    status: "connected" | "disconnected" | string;
    created_at: string;
    updated_at: string;
}
