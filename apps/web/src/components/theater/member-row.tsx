import {
  IconCircleOff,
  IconMicrophoneOff,
  IconScreenShare,
  IconVideo,
  IconWaveSine,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";
import type { ParticipantMedia, Role, RoomMember } from "../../shared-types.ts";
import { Avatar } from "../ui/avatar.tsx";
import { Badge } from "../ui/badge.tsx";
import { ConnectionIndicator } from "./connection-indicator.tsx";
import { MemberPermissionsModal } from "./member-permissions-modal.tsx";

const roleKey: Record<Role, string> = {
  owner: "indicator.roleOwner",
  admin: "indicator.roleAdmin",
  moderator: "indicator.roleModerator",
  member: "indicator.roleMember",
};

type MemberRowProps = {
  member: RoomMember;
  selfId?: string;
  actorRole?: Role;
  omeLive?: boolean;
  media?: ParticipantMedia;
  roomId: string;
};

export function MemberRow({
  member,
  selfId,
  actorRole,
  omeLive,
  media,
  roomId,
}: MemberRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isSelf = member.userId === selfId;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
          isSelf
            ? "border-accent/30 bg-surface-sunken shadow-[0_0_15px_var(--hero-glow)]"
            : "border-transparent hover:border-border/50 hover:bg-surface-sunken/60",
        )}
      >
        <Avatar
          id={member.userId}
          name={member.displayName}
          size="md"
          speaking={media?.speaking}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm font-medium", isSelf ? "text-accent" : "text-ink")}>
              {member.displayName}
              {isSelf ? (
                <span className="ml-1 text-xs font-normal text-ink-muted">({t("app.you")})</span>
              ) : null}
            </span>
            <Badge tone={member.role === "owner" ? "accent" : "neutral"}>{t(roleKey[member.role])}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
            {media?.speaking ? (
              <span className="inline-flex items-center gap-1">
                <IconWaveSine className="size-3.5 text-accent" aria-hidden="true" />
                {t("indicator.speaking")}
              </span>
            ) : null}
            {member.muted ? (
              <span className="inline-flex items-center gap-1">
                <IconMicrophoneOff className="size-3.5" aria-hidden="true" />
                {t("indicator.muted")}
              </span>
            ) : null}
            {media?.camera ? (
              <span className="inline-flex items-center gap-1">
                <IconVideo className="size-3.5" aria-hidden="true" />
                {t("indicator.camera")}
              </span>
            ) : null}
            {media?.screen ? (
              <span className="inline-flex items-center gap-1">
                <IconScreenShare className="size-3.5" aria-hidden="true" />
                {t("indicator.screen")}
              </span>
            ) : null}
            {!member.present ? (
              <span className="inline-flex items-center gap-1">
                <IconCircleOff className="size-3.5" aria-hidden="true" />
                {t("indicator.offline")}
              </span>
            ) : null}
            {omeLive ? <span>{t("indicator.ome")}</span> : null}
            <ConnectionIndicator quality={media?.quality ?? "unknown"} />
          </div>
        </div>
      </button>
      <MemberPermissionsModal
        open={open}
        onClose={() => setOpen(false)}
        roomId={roomId}
        actorRole={actorRole}
        member={member}
        isSelf={isSelf}
      />
    </li>
  );
}
