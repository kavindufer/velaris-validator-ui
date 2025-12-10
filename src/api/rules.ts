import { apiGet, apiPost } from "./client";
import type { ValidationRule } from "../types/api";

/**
 * Fetch all active (non-archived) rules for the current tenant.
 */
export async function fetchActiveRules(): Promise<ValidationRule[]> {
    return apiGet<ValidationRule[]>("/validation-rules");
}

/**
 * Fetch archived rules for the current tenant.
 */
export async function fetchArchivedRules(): Promise<ValidationRule[]> {
    return apiGet<ValidationRule[]>("/validation-rules/archived");
}

/**
 * Soft-archive a rule.
 */
export async function archiveRule(ruleId: string): Promise<ValidationRule> {
    return apiPost<ValidationRule>(
        `/validation-rules/${encodeURIComponent(ruleId)}/archive`,
    );
}

/**
 * Restore an archived rule.
 */
export async function restoreRule(ruleId: string): Promise<ValidationRule> {
    return apiPost<ValidationRule>(
        `/validation-rules/${encodeURIComponent(ruleId)}/restore`,
    );
}
