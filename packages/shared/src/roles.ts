export const ROLES = ["owner", "admin", "moderator", "member"] as const;

export type Role = (typeof ROLES)[number];

export const ASSIGNABLE_ROLES = ["admin", "moderator", "member"] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export type ModerationAction = "kick" | "mute" | "ban" | "unban" | "role";

const RANK: Record<Role, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
};

export function roleRank(role: Role): number {
  return RANK[role];
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isAssignableRole(value: string): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export function canKick(role: Role): boolean {
  return RANK[role] >= RANK.moderator;
}

export function canMute(role: Role): boolean {
  return RANK[role] >= RANK.moderator;
}

export function canBan(role: Role): boolean {
  return RANK[role] >= RANK.admin;
}

export function canManageRoles(role: Role): boolean {
  return RANK[role] >= RANK.admin;
}

export function canSeeIngest(role: Role): boolean {
  return RANK[role] >= RANK.admin;
}

export function canManageBroadcast(role: Role): boolean {
  return RANK[role] >= RANK.admin;
}

/**
 * Owner is never a valid target (immutable admin).
 * Moderators may only kick/mute members.
 * Admins and the owner may act on any non-owner.
 */
export function canModerateTarget(
  actor: Role,
  target: Role,
  action: ModerationAction,
): boolean {
  if (target === "owner") return false;
  if (action === "ban" || action === "unban" || action === "role") {
    if (RANK[actor] < RANK.admin) return false;
  } else if (action === "kick" || action === "mute") {
    if (RANK[actor] < RANK.moderator) return false;
  }
  if (actor === "owner" || actor === "admin") return true;
  if (actor === "moderator") return target === "member";
  return false;
}
