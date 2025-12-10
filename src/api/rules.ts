import { apiGet, apiPost } from "./client";
import type { ValidationRule } from "../types/api.ts";

export async function fetchActiveRules(): Promise<ValidationRule[]> {
    return apiGet<ValidationRule[]>("/validation-rules");
}

export async function fetchArchivedRules(): Promise<ValidationRule[]> {
    return apiGet<ValidationRule[]>("/validation-rules/archived");
}

export async function archiveRule(ruleId: string): Promise<ValidationRule> {
    return apiPost<ValidationRule>(
        `/validation-rules/${encodeURIComponent(ruleId)}/archive`,
    );
}

export async function restoreRule(ruleId: string): Promise<ValidationRule> {
    return apiPost<ValidationRule>(
        `/validation-rules/${encodeURIComponent(ruleId)}/restore`,
    );
}
