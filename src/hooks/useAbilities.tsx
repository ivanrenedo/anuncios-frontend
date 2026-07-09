"use client";

import { useQuery } from "@apollo/client/react";
import { ADMIN_ME, GET_ROLES } from "@/graphql/queries";

export type AdminAction = "create" | "read" | "update" | "delete";

const SUPER_ADMIN = "SUPER_ADMIN";
const norm = (s?: string | null) =>
  (s ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");

/**
 * Resolves what the *current* admin can do, from their role's `actions`.
 * The SUPER_ADMIN role can always do everything. Deny by default — mirrors the
 * backend ActionsGuard so the UI matches what the server will enforce.
 */
export function useAbilities() {
  const { data: meData } = useQuery(ADMIN_ME) as { data: any };
  const { data: rolesData } = useQuery(GET_ROLES) as { data: any };

  const me = meData?.me;
  const roles: any[] = rolesData?.roles ?? [];
  const role = roles.find((r) => r.id === me?.rolId);

  const isSuperAdmin = norm(role?.label) === SUPER_ADMIN;
  const actions = new Set<string>(role?.actions ?? []);

  const can = (action: AdminAction) => isSuperAdmin || actions.has(action);

  return { can, isSuperAdmin, role, ready: !!me };
}
