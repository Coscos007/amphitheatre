import { useBlocker, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ApiError,
  createSession,
  getMedia,
  getRoom,
  getSession,
  isLockoutError,
  isNotFoundError,
  joinRoom,
  leaveRoom,
} from "../../lib/api.ts";
import { joinErrorMessageKey } from "../../lib/join-errors.ts";
import { NotFoundScreen } from "../not-found-screen.tsx";
import { LeaveRoomDialog } from "./leave-room-dialog.tsx";
import { emptyBroadcast } from "@coliseum/shared";
import { canManageBroadcast, canSeeIngest } from "../../lib/permissions.ts";
import { useDelayedFlag, useTheaterLayout } from "../../hooks/use-media.ts";
import { useLivekitRoom } from "../../hooks/use-livekit.ts";
import { useRoomSocket } from "../../hooks/use-room-socket.ts";
import { useUnreadChat } from "../../hooks/use-unread-chat.ts";
import type { SideTab } from "./theater-side-panel.tsx";
import { useRoomStore } from "../../stores/room-store.ts";
import { useSessionStore } from "../../stores/session-store.ts";
import { TheaterSkeleton } from "../ui/skeleton.tsx";
import { ChatPanel } from "./chat-panel.tsx";
import { ControlBar } from "./control-bar.tsx";
import { DesktopTheaterLayout } from "./desktop-theater-layout.tsx";
import { JoinGate } from "./join-gate.tsx";
import { MemberList } from "./member-list.tsx";
import { MobileTheaterLayout } from "./mobile-theater-layout.tsx";
import { BroadcastStatus } from "./broadcast-status.tsx";
import { RoomSettingsModal } from "./room-settings-modal.tsx";
import { Stage } from "./stage.tsx";

export function TheaterScreen({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const layout = useTheaterLayout();
  const user = useSessionStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);
  const room = useRoomStore((s) => s.room);
  const messages = useRoomStore((s) => s.messages);
  const ome = useRoomStore((s) => s.ome);
  const mediaByUserId = useRoomStore((s) => s.mediaByUserId);
  const livekitStatus = useRoomStore((s) => s.livekitStatus);
  const micEnabled = useRoomStore((s) => s.micEnabled);
  const cameraEnabled = useRoomStore((s) => s.cameraEnabled);
  const screenEnabled = useRoomStore((s) => s.screenEnabled);
  const lockoutUntil = useRoomStore((s) => s.lockoutUntil);
  const chatMutedUntil = useRoomStore((s) => s.chatMutedUntil);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setOme = useRoomStore((s) => s.setOme);
  const setBroadcast = useRoomStore((s) => s.setBroadcast);
  const setLivekitCreds = useRoomStore((s) => s.setLivekitCreds);
  const setLockout = useRoomStore((s) => s.setLockout);
  const reset = useRoomStore((s) => s.reset);

  const [gate, setGate] = useState(false);
  const [gateError, setGateError] = useState<string | undefined>();
  const [joined, setJoined] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("chat");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const allowNavRef = useRef(false);

  useEffect(() => {
    allowNavRef.current = false;
  }, [roomId]);

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  });

  useEffect(() => {
    if (sessionQuery.data) setSession(sessionQuery.data);
  }, [sessionQuery.data, setSession]);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
    retry: false,
    enabled: sessionQuery.isFetched,
  });

  useEffect(() => {
    if (roomQuery.data) setRoom(roomQuery.data);
  }, [roomQuery.data, setRoom]);

  const chatVisible =
    layout === "mobile" ? mobileDrawerOpen && sideTab === "chat" : sideTab === "chat";
  const unreadChat = useUnreadChat({
    messages,
    selfId: user?.userId,
    chatVisible,
    enabled: joined,
  });

  useEffect(() => {
    const base = room?.name ? `${room.name} · Amphitheatre` : "Amphitheatre";
    const badge = unreadChat > 99 ? "99+" : String(unreadChat);
    document.title = unreadChat > 0 ? `(${badge}) ${base}` : base;
    return () => {
      document.title = "Amphitheatre";
    };
  }, [room?.name, unreadChat]);

  const applyJoin = useCallback(
    (result: Awaited<ReturnType<typeof joinRoom>>) => {
      setRoom(result.room);
      if (result.ome) setOme(result.ome);
      if (result.livekitToken && result.livekitUrl) {
        setLivekitCreds({ token: result.livekitToken, url: result.livekitUrl });
      }
      setJoined(true);
      setGate(false);
      setGateError(undefined);
    },
    [setLivekitCreds, setOme, setRoom],
  );

  useEffect(() => {
    if (!roomQuery.isFetched) return;
    if (roomQuery.isError) return;
    const current = useSessionStore.getState().user;
    const fetched = roomQuery.data;
    if (!current) {
      setGate(true);
      return;
    }
    const alreadyIn = fetched?.members?.some(
      (member) => member.userId === current.userId && member.present,
    );
    if (alreadyIn) {
      setJoined(true);
      setGate(false);
      return;
    }
    if (fetched && !fetched.hasPassword) {
      void (async () => {
        try {
          const result = await joinRoom(roomId);
          applyJoin(result);
        } catch (error) {
          if (isLockoutError(error)) {
            setLockout(Date.now() + (error.remainingMs ?? 300000));
          }
          if (error instanceof ApiError) {
            setGateError(t(joinErrorMessageKey(error)));
          }
          setGate(true);
        }
      })();
      return;
    }
    setGate(true);
  }, [applyJoin, roomQuery.isFetched, roomQuery.data, roomQuery.isError, roomId, setLockout, t]);

  useQuery({
    queryKey: ["media", roomId],
    queryFn: async () => {
      const media = await getMedia(roomId);
      setOme(media.ome);
      if (media.broadcast) setBroadcast(media.broadcast);
      return media;
    },
    enabled: joined,
    refetchInterval: 8000,
  });

  const { sendChat, sendPresence } = useRoomSocket(roomId, joined);
  const livekit = useLivekitRoom(roomId, joined);

  useEffect(() => {
    if (!joined) return;
    sendPresence({ camera: cameraEnabled, screen: screenEnabled });
  }, [joined, cameraEnabled, screenEnabled, sendPresence]);
  const loading = sessionQuery.isLoading || (roomQuery.isLoading && !gate);
  const showSkeleton = useDelayedFlag(loading);

  const selfMember = room?.members?.find((member) => member.userId === user?.userId);
  const omeLive = Boolean(ome?.healthy && ome.live);

  const onGateJoin = async (values: { displayName: string; password?: string }) => {
    try {
      const session = await createSession(values.displayName);
      setSession(session, session.token);
      const result = await joinRoom(roomId, values.password);
      applyJoin(result);
      toast.success(t("toast.joined"));
    } catch (error) {
      if (isLockoutError(error)) {
        setLockout(Date.now() + (error.remainingMs ?? 300000));
        setGateError(undefined);
        return;
      }
      if (error instanceof ApiError) {
        setGateError(t(joinErrorMessageKey(error)));
        return;
      }
      setGateError(t("toast.joinFailed"));
    }
  };

  const shouldBlockFn = useCallback(
    ({ current, next }: { current: { pathname: string }; next: { pathname: string } }) => {
      if (allowNavRef.current) return false;
      if (!joined) return false;
      return current.pathname !== next.pathname;
    },
    [joined],
  );

  const blocker = useBlocker({
    shouldBlockFn,
    withResolver: true,
    enableBeforeUnload: false,
  });

  useEffect(() => {
    if (blocker.status === "blocked") setLeaveOpen(true);
  }, [blocker.status]);

  const requestLeave = () => setLeaveOpen(true);

  const cancelLeave = () => {
    setLeaveOpen(false);
    if (blocker.status === "blocked") blocker.reset();
  };

  const confirmLeave = () => {
    allowNavRef.current = true;
    setLeaveOpen(false);
    void leaveRoom(roomId).catch(() => undefined);
    reset();
    toast.success(t("toast.left"));
    if (blocker.status === "blocked") {
      blocker.proceed();
      return;
    }
    void navigate({ to: "/" });
  };

  if (showSkeleton) return <TheaterSkeleton />;
  if (isNotFoundError(roomQuery.error)) return <NotFoundScreen kind="room" />;
  if (loading) return <div className="min-h-dvh bg-surface-page" />;

  const preview = roomQuery.data ?? room;
  if (gate || !joined || !room) {
    return (
      <JoinGate
        roomName={preview?.name}
        hasPassword={Boolean(preview?.hasPassword)}
        lockoutUntil={lockoutUntil}
        error={gateError}
        onJoin={onGateJoin}
      />
    );
  }

  const members = (
    <MemberList
      members={room.members ?? []}
      selfId={user?.userId}
      actorRole={selfMember?.role}
      omeLive={omeLive}
      mediaByUserId={mediaByUserId}
      roomId={roomId}
    />
  );
  const chat = (
    <ChatPanel
      messages={messages}
      selfId={user?.userId}
      roomName={room.name}
      mutedUntil={chatMutedUntil}
      onSend={(text) => sendChat(text)}
    />
  );
  const broadcast = room.broadcast ?? emptyBroadcast();
  const stage = (
    <Stage
      broadcast={broadcast}
      ome={ome}
      tiles={livekit.tiles}
      compact={layout === "mobile"}
    />
  );
  const controls = (
    <ControlBar
      roomName={room.name}
      roomId={roomId}
      micEnabled={micEnabled}
      cameraEnabled={cameraEnabled}
      screenEnabled={screenEnabled}
      micLocked={Boolean(selfMember?.muted)}
      livekitUnavailable={livekitStatus === "unavailable"}
      compact={layout === "mobile"}
      onMic={livekit.setMic}
      onCamera={livekit.setCamera}
      onScreen={livekit.setScreen}
      onLeave={requestLeave}
    />
  );

  const memberCount = (room.members ?? []).filter((member) => member.present).length;
  const layoutProps = {
    roomName: room.name,
    status: <BroadcastStatus broadcast={broadcast} omeLive={omeLive} />,
    memberCount,
    stage,
    members,
    chat,
    controls,
    onSettings: () => setSettingsOpen(true),
    onLeaveHome: requestLeave,
    sideTab,
    onSideTabChange: setSideTab,
    unreadChat,
  };

  return (
    <>
      {layout === "mobile" ? (
        <MobileTheaterLayout
          {...layoutProps}
          drawerOpen={mobileDrawerOpen}
          onDrawerOpenChange={setMobileDrawerOpen}
        />
      ) : (
        <DesktopTheaterLayout {...layoutProps} />
      )}
      <LeaveRoomDialog open={leaveOpen} onCancel={cancelLeave} onConfirm={confirmLeave} />
      <RoomSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        broadcast={broadcast}
        floodBanSec={room.chatFloodBanSec ?? 60}
        ingest={selfMember && canSeeIngest(selfMember.role) ? ome?.ingest : null}
        canAdmin={Boolean(selfMember && canManageBroadcast(selfMember.role))}
        listDevices={livekit.listDevices}
        switchDevice={livekit.switchDevice}
        setOutputVolume={livekit.setOutputVolume}
        setInputVolume={livekit.setInputVolume}
        micEnabled={micEnabled}
        micLocked={Boolean(selfMember?.muted)}
        setMic={livekit.setMic}
        onChatSaved={(sec) => setRoom({ ...room, chatFloodBanSec: sec })}
      />
    </>
  );
}
