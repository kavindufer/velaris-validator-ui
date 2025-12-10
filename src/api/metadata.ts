import { apiGet } from "./client";

// Mirrors /metadata/velaris-objects
export interface VelarisObjectMeta {
    api_name: string; // e.g. "invoice"
    label: string;    // e.g. "Invoice"
}

// Mirrors /metadata/stripe-resources
export interface StripeResourceMeta {
    system: string;   // "stripe"
    resource: string; // "customers" | "invoices" | ...
    label: string;    // "Stripe Invoices"
}

// Mirrors /metadata/field-mappings
export interface FieldMappingMeta {
    source_system: string;
    source_resource: string;
    source_path: string;
    target_object: string;
    target_field: string;
    label?: string | null;
    description?: string | null;
}

export async function fetchVelarisObjects(): Promise<VelarisObjectMeta[]> {
    return apiGet<VelarisObjectMeta[]>("/metadata/velaris-objects");
}

export async function fetchStripeResources(): Promise<StripeResourceMeta[]> {
    return apiGet<StripeResourceMeta[]>("/metadata/stripe-resources");
}

export async function fetchFieldMappings(params?: {
    source_system?: string;
    source_resource?: string;
    target_object?: string;
}): Promise<FieldMappingMeta[]> {
    const qs = new URLSearchParams();

    if (params?.source_system) qs.set("source_system", params.source_system);
    if (params?.source_resource) qs.set("source_resource", params.source_resource);
    if (params?.target_object) qs.set("target_object", params.target_object);

    const path = qs.toString()
        ? `/metadata/field-mappings?${qs.toString()}`
        : "/metadata/field-mappings";

    return apiGet<FieldMappingMeta[]>(path);
}
