export const ALLOWED_ERP_ROLES = new Set([
  "ADMIN",
  "STAFF",
  "KASIR",
  "OWNER",
  "MANAGER",
  "GUDANG",
]);

export function hasErpAccess(user: Record<string, any> | null | undefined): boolean {
  if (!user) return false;
  if (Array.isArray(user.permissions) && user.permissions.includes("erp:access")) {
    return true;
  }
  const userType = String(user.userType || "").trim().toUpperCase();
  const staffRole = String(user.staffRole || user.role || "").trim().toUpperCase();
  return ALLOWED_ERP_ROLES.has(userType) || ALLOWED_ERP_ROLES.has(staffRole);
}

export function hasErpPermission(
  user: Record<string, any> | null | undefined,
  permissionCode: string
): boolean {
  if (!user) return false;
  const userType = String(user.userType || "").trim().toUpperCase();
  const staffRole = String(user.staffRole || user.role || "").trim().toUpperCase();
  if (userType === "OWNER" || userType === "ADMIN" || staffRole === "OWNER" || staffRole === "ADMIN") {
    return true;
  }
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permissionCode);
  }
  return hasErpAccess(user);
}
