import type { CurrentUser } from "../api/client";

/**
 * Returns true if the user is a platform-level operator (SUPERADMIN).
 */
export function isPlatformAdmin(user: CurrentUser | null | undefined): boolean {
    return user?.role === "SUPERADMIN";
}

/**
 * Tenant-level write permissions – can create / edit / archive rules.
 * SUPERADMIN also counts as "can manage" if they ever visit tenant views.
 */
export function canManageRules(user: CurrentUser | null | undefined): boolean {
    if (!user?.role) return false;
    return user.role === "ADMIN" || user.role === "SUPERADMIN";
}

/**
 * Same permission model as rules for now.
 */
export function canManageJobs(user: CurrentUser | null | undefined): boolean {
    return canManageRules(user);
}

/**
 * In future we might differentiate archive vs hard-delete.
 * For now, same as "can manage".
 */
export function canArchiveEntities(user: CurrentUser | null | undefined): boolean {
    return canManageRules(user);
}

/**
 * Nice little helper if you ever want to show role labels.
 */
export function roleLabel(role: CurrentUser["role"] | undefined): string {
    if (!role) return "UNKNOWN";
    switch (role) {
        case "SUPERADMIN":
            return "SUPERADMIN";
        case "ADMIN":
            return "ADMIN";
        case "VIEWER":
            return "VIEWER";
        default:
            return role;
    }
}
