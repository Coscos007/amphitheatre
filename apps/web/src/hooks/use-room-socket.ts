import type { ClientEvent, PresenceState, ServerEvent } from "@coliseum/shared";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { asBroadcast, asChat, asOme, roomWsUrl } from "../lib/api.ts";
import i18n from "../lib/i18n.ts";
import { useRoomStore } from "../stores/room-store.ts";
import { useSessionStore } from "../stores/session-store.ts";

function asEvent(data: unknown): ServerEvent | null {
  if (!data || typeof data !== "object" || !("type" in data)) return null;
  return data as ServerEvent;
}

function presenceToMembers(members: PresenceState[]) {
  return members.map((item) => ({
    userId: item.userId,
    displayName: item.displayName,
    role: item.role,
    muted: item.muted,
    present: item.present,
    connected: item.connected,
  }));
}

export function useRoomSocket(roomId: string | undefined, enabled: boolean) {
  const socketRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    if (!roomId || !enabled) return;
    let stopped = false;
    let timer: number | undefined;

    const connect = () => {
      if (stopped) return;
      const ws = new WebSocket(roomWsUrl(roomId));
      socketRef.current = ws;

      ws.onmessage = (event) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(event.data)) as unknown;
        } catch {
          return;
        }
        const msg = asEvent(parsed);
        if (!msg) return;
        const store = useRoomStore.getState();
        const selfId = useSessionStore.getState().user?.userId;

        switch (msg.type) {
          case "chat": {
            const chat = asChat(msg.payload);
            if (chat) store.addMessage(chat);
            break;
          }
          case "presence": {
            store.patchMembers(presenceToMembers(msg.payload.members));
            for (const member of msg.payload.members) {
              store.setMedia(member.userId, {
                speaking: member.speaking,
                camera: member.camera,
                screen: member.screen,
                quality: member.quality ?? "unknown",
              });
            }
            break;
          }
          case "speaking":
            store.setMedia(msg.payload.userId, { speaking: msg.payload.speaking });
            break;
          case "transmitting":
            store.setMedia(msg.payload.userId, {
              camera: msg.payload.camera,
              screen: msg.payload.screen,
            });
            break;
          case "quality":
            store.setMedia(msg.payload.userId, {
              quality: msg.payload.connectionQuality,
              adaptive: msg.payload.connectionQuality === "poor" || msg.payload.connectionQuality === "lost",
            });
            break;
          case "ome":
            store.setOme(asOme(msg.payload) ?? msg.payload);
            break;
          case "broadcast": {
            const broadcast = asBroadcast(msg.payload);
            if (broadcast) store.setBroadcast(broadcast);
            break;
          }
          case "moderation": {
            if (msg.payload.action === "mute") {
              const members = store.room?.members ?? [];
              const target = members.find((item) => item.userId === msg.payload.userId);
              if (target) {
                store.upsertMember({ ...target, muted: Boolean(msg.payload.muted) });
              }
            }
            if (msg.payload.action === "role" && msg.payload.role && msg.payload.role !== "owner") {
              const members = store.room?.members ?? [];
              const target = members.find((item) => item.userId === msg.payload.userId);
              if (target) store.upsertMember({ ...target, role: msg.payload.role });
            }
            if (msg.payload.action === "kick" || msg.payload.action === "ban") {
              if (msg.payload.userId === selfId) {
                toast.error(
                  i18n.t(msg.payload.action === "ban" ? "toast.selfBanned" : "toast.selfKicked"),
                );
                store.reset();
                window.location.assign("/");
              } else {
                store.removeMember(msg.payload.userId);
              }
            }
            break;
          }
          case "system": {
            if (msg.payload.code === "ping") break;
            if (msg.payload.code === "chat_slow") {
              const wait = msg.payload.retryAfterMs ?? 60_000;
              store.setChatMutedUntil(Date.now() + wait);
              toast.error(i18n.t("toast.chatSlow"));
              break;
            }
            if (
              (msg.payload.code === "kicked" || msg.payload.code === "banned") &&
              msg.payload.userId === selfId
            ) {
              toast.error(
                i18n.t(msg.payload.code === "banned" ? "toast.selfBanned" : "toast.selfKicked"),
              );
              store.reset();
              window.location.assign("/");
            }
            break;
          }
          default:
            break;
        }
      };

      ws.onopen = () => {
        retriesRef.current = 0;
      };

      ws.onclose = () => {
        if (stopped) return;
        retriesRef.current += 1;
        if (retriesRef.current === 2) toast.error(i18n.t("toast.wsFailed"));
        const delay = Math.min(8000, 500 * 2 ** Math.min(retriesRef.current, 4));
        timer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [roomId, enabled]);

  const send = useCallback((event: ClientEvent) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(event));
    return true;
  }, []);

  const sendChat = useCallback((text: string) => send({ type: "chat.send", text }), [send]);
  const sendPresence = useCallback(
    (patch: Omit<Extract<ClientEvent, { type: "presence.update" }>, "type">) =>
      send({ type: "presence.update", ...patch }),
    [send],
  );

  return { sendChat, sendPresence };
}
