import { apiGet, apiPost } from "./client";
import type { ValidationJob } from "../types/api.ts";

export async function fetchActiveJobs(): Promise<ValidationJob[]> {
    return apiGet<ValidationJob[]>("/validation-jobs");
}

export async function fetchArchivedJobs(): Promise<ValidationJob[]> {
    return apiGet<ValidationJob[]>("/validation-jobs/archived");
}

export async function archiveJob(jobId: string): Promise<ValidationJob> {
    return apiPost<ValidationJob>(
        `/validation-jobs/${encodeURIComponent(jobId)}/archive`,
    );
}

export async function restoreJob(jobId: string): Promise<ValidationJob> {
    return apiPost<ValidationJob>(
        `/validation-jobs/${encodeURIComponent(jobId)}/restore`,
    );
}
