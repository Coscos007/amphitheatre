import { useState } from "react";
import { IconDotsVertical } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  banMember,
  kickMember,
  muteMember,
  setMemberRole,
} from "../../lib/api.ts";
import { canManageRoles, canModerateTarget } from "../../lib/permissions.ts";
import type { AssignableRole, Role, RoomMember } from "../../shared-types.ts";
import { Button } from "../ui/button.tsx";
import { Dialog } from "../ui/dialog.tsx";

type Pending =
  | { kind: "kick" }
  | { kind: "ban" }
  | { kind: "mute" }
  | { kind: "role"; role: AssignableRole };

type ModerationMenuProps = {
  roomId: string;
  actorRole: Role;
  member: RoomMember;
};

export function ModerationMenu({ roomId, actorRole, member }: ModerationMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const canKick = canModerateTarget(actorRole, member.role, "kick");
  const canMute = canModerateTarget(actorRole, member.role, "mute");
  const canBan = canModerateTarget(actorRole, member.role, "ban");
  const canRoles = canManageRoles(actorRole) && canModerateTarget(actorRole, member.role, "role");

  if (!canKick && !canMute && !canBan && !canRoles) return null;

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === "kick") {
        await kickMember(roomId, member.userId);
        toast.success(t("toast.kicked", { name: member.displayName }));
      } else if (pending.kind === "ban") {
        await banMember(roomId, member.userId);
        toast.success(t("toast.banned", { name: member.displayName }));
      } else if (pending.kind === "mute") {
        await muteMember(roomId, { userId: member.userId, muted: !member.muted });
        toast.success(
          t(member.muted ? "toast.unmuted" : "toast.muted", { name: member.displayName }),
        );
      } else {
        await setMemberRole(roomId, { userId: member.userId, role: pending.role });
        toast.success(t("toast.roleChanged"));
      }
      setPending(null);
      setOpen(false);
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  const title =
    pending?.kind === "kick"
      ? t("mod.kickTitle", { name: member.displayName })
      : pending?.kind === "ban"
        ? t("mod.banTitle", { name: member.displayName })
        : pending?.kind === "mute"
          ? t("mod.muteTitle", { name: member.displayName })
          : pending
            ? t("mod.roleTitle", { name: member.displayName })
            : "";

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="iconTouch"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("mod.menu")}
        onClick={() => setOpen((value) => !value)}
      >
        <IconDotsVertical aria-hidden="true" />
      </Button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-48 border border-border bg-surface-raised p-1 shadow-lg"
        >
          {canKick ? (
            <li>
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-sunken"
                onClick={() => setPending({ kind: "kick" })}
              >
                {t("mod.kick")}
              </button>
            </li>
          ) : null}
          {canMute ? (
            <li>
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-sunken"
                onClick={() => setPending({ kind: "mute" })}
              >
                {member.muted ? t("mod.unmute") : t("mod.mute")}
              </button>
            </li>
          ) : null}
          {canBan ? (
            <li>
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full items-center px-3 text-left text-sm text-danger hover:bg-danger-soft"
                onClick={() => setPending({ kind: "ban" })}
              >
                {t("mod.ban")}
              </button>
            </li>
          ) : null}
          {canRoles ? (
            <>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-sunken"
                  onClick={() => setPending({ kind: "role", role: "admin" })}
                >
                  {t("mod.setAdmin")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-sunken"
                  onClick={() => setPending({ kind: "role", role: "moderator" })}
                >
                  {t("mod.setModerator")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-sunken"
                  onClick={() => setPending({ kind: "role", role: "member" })}
                >
                  {t("mod.setMember")}
                </button>
              </li>
            </>
          ) : null}
        </ul>
      ) : null}
      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t("app.cancel")}
            </Button>
            <Button
              variant={pending?.kind === "ban" || pending?.kind === "kick" ? "danger" : "primary"}
              onClick={() => void run()}
              loading={busy}
            >
              {t("app.confirm")}
            </Button>
          </>
        }
      >
        <p>
          {pending?.kind === "kick"
            ? t("mod.kickBody")
            : pending?.kind === "ban"
              ? t("mod.banBody")
              : pending?.kind === "mute"
                ? t("mod.muteBody")
                : t("mod.roleBody")}
        </p>
      </Dialog>
    </div>
  );
}
