import { apiGet, apiPost } from "./client";
import type {
    DvTask,
    DvTaskDetail,
    RunDvTaskResponse,
    JoinHint,
} from "../types/api";

export interface DirectMappingInput {
    source_field: string;
    target_field: string;
}

export interface TransformationInput {
    target_field: string;
    expression: string;
    notes?: string | null;
}

export interface DvTaskDesignPayload {
    name: string;
    description?: string | null;
    target_velaris_object: string;
    source_system?: string; // default "stripe"
    source_resource: string;
    dedupe_key: string;
    join_hint: JoinHint;
    direct_mappings?: DirectMappingInput[];
    transformations?: TransformationInput[];
}

/**
 * List DV tasks for the current tenant.
 */
export async function fetchDvTasks(): Promise<DvTask[]> {
    return apiGet<DvTask[]>("/dv-tasks");
}

/**
 * Get a DV task with attached rules.
 */
export async function fetchDvTask(taskId: string): Promise<DvTaskDetail> {
    return apiGet<DvTaskDetail>(`/dv-tasks/${encodeURIComponent(taskId)}`);
}

/**
 * Create a DV task + auto-generate rules.
 */
export async function createDvTask(
    payload: DvTaskDesignPayload,
): Promise<DvTaskDetail> {
    return apiPost<DvTaskDetail>("/dv-tasks", {
        // Force stripe as default source system for now
        source_system: "stripe",
        ...payload,
    });
}

/**
 * Run all active rules under a DV task.
 */
export async function runDvTask(taskId: string): Promise<RunDvTaskResponse> {
    return apiPost<RunDvTaskResponse>(
        `/dv-tasks/${encodeURIComponent(taskId)}/run`,
    );
}
