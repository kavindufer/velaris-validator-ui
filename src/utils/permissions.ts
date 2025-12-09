import type { CurrentUser } from "../api/client";

/**
 * Returns true if the given user is a platform-level admin (SUPERADMIN).
 */
export function isPlatformAdmin(
    user: CurrentUser | null | undefined,
): boolean {
    return user?.role === "SUPERADMIN";
}

/**
 * Returns true if the user is at least a tenant admin (ADMIN or SUPERADMIN).
 * (Handy for future UI decisions.)
 */
export function isTenantAdmin(
    user: CurrentUser | null | undefined,
): boolean {
    return user?.role === "ADMIN" || user?.role === "SUPERADMIN";
}
