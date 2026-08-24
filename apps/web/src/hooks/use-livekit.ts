import {
  ConnectionQuality,
  Room,
  RemoteAudioTrack,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type Participant,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getLivekitToken } from "../lib/api.ts";
import { readDevicePrefs } from "../lib/device-prefs.ts";
import i18n from "../lib/i18n.ts";
import type { ParticipantMedia } from "../shared-types.ts";
import { useRoomStore } from "../stores/room-store.ts";

export type MediaDeviceKindName = "audioinput" | "audiooutput" | "videoinput";

export type StageTile = {
  id: string;
  identity: string;
  name: string;
  source: "camera" | "screen";
  isLocal: boolean;
  track: Track;
};

function mapQuality(quality: ConnectionQuality): ParticipantMedia["quality"] {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return "excellent";
    case ConnectionQuality.Good:
      return "good";
    case ConnectionQuality.Poor:
      return "poor";
    case ConnectionQuality.Lost:
      return "lost";
    default:
      return "unknown";
  }
}

function publicationFlags(participant: Participant) {
  let camera = false;
  let screen = false;
  participant.videoTrackPublications.forEach((pub) => {
    if (!isActiveVideoPublication(pub, participant.isLocal)) return;
    if (pub.source === Track.Source.ScreenShare) screen = true;
    if (pub.source === Track.Source.Camera) camera = true;
  });
  return { camera, screen };
}

function applyRemoteVolume(room: Room, volume: number) {
  room.remoteParticipants.forEach((participant) => {
    participant.audioTrackPublications.forEach((pub) => {
      if (pub.audioTrack instanceof RemoteAudioTrack) {
        pub.audioTrack.setVolume(volume);
      }
    });
  });
}

async function applySavedDevices(room: Room) {
  const prefs = readDevicePrefs();
  try {
    if (prefs.audioinput) await room.switchActiveDevice("audioinput", prefs.audioinput);
    if (prefs.videoinput) await room.switchActiveDevice("videoinput", prefs.videoinput);
    if (prefs.audiooutput) await room.switchActiveDevice("audiooutput", prefs.audiooutput);
  } catch {
    /* device may have been unplugged */
  }
  applyRemoteVolume(room, prefs.outputVolume);
  applyInputVolume(room, prefs.inputVolume);
}

function applyInputVolume(room: Room, volume: number) {
  room.localParticipant.audioTrackPublications.forEach((pub) => {
    const track = pub.audioTrack as { setVolume?: (next: number) => void } | null;
    track?.setVolume?.(volume);
  });
}

function isActiveVideoPublication(
  pub: { track?: Track | null; isMuted: boolean; isSubscribed?: boolean; source: Track.Source },
  isLocal: boolean,
): boolean {
  const track = pub.track;
  if (!track || pub.isMuted) return false;
  if (!isLocal && pub.isSubscribed === false) return false;
  const media = track.mediaStreamTrack;
  if (media && media.readyState === "ended") return false;
  return true;
}

export function useLivekitRoom(roomId: string | undefined, enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const [tiles, setTiles] = useState<StageTile[]>([]);

  const refreshTiles = useCallback((room: Room) => {
    const next: StageTile[] = [];
    const collect = (participant: Participant, isLocal: boolean) => {
      participant.videoTrackPublications.forEach((pub) => {
        if (!isActiveVideoPublication(pub, isLocal)) return;
        const track = pub.track;
        if (!track) return;
        const screen = pub.source === Track.Source.ScreenShare;
        next.push({
          id: `${participant.identity}-${pub.trackSid}`,
          identity: participant.identity,
          name: participant.name || participant.identity,
          source: screen ? "screen" : "camera",
          isLocal,
          track,
        });
      });
    };
    collect(room.localParticipant, true);
    room.remoteParticipants.forEach((participant) => collect(participant, false));
    setTiles(next);
  }, []);

  const syncParticipant = useCallback((participant: Participant) => {
    const flags = publicationFlags(participant);
    useRoomStore.getState().setMedia(participant.identity, {
      speaking: participant.isSpeaking,
      audioLevel: participant.audioLevel,
      camera: flags.camera,
      screen: flags.screen,
      quality: mapQuality(participant.connectionQuality),
    });
  }, []);

  useEffect(() => {
    if (!roomId || !enabled) return;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;
    let stopped = false;
    const store = useRoomStore.getState();
    store.setLivekitStatus("connecting");

    const onMedia = (
      _track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      syncParticipant(participant);
      if (publication.kind === Track.Kind.Video) {
        const quality = publication.videoQuality;
        if (quality === 0) {
          store.setMedia(participant.identity, { adaptive: true });
        }
        _track.mediaStreamTrack?.addEventListener("ended", () => refreshTiles(room), { once: true });
      }
      refreshTiles(room);
    };

    room.on(RoomEvent.TrackSubscribed, onMedia);
    room.on(RoomEvent.TrackUnsubscribed, (_track, _pub, participant) => {
      syncParticipant(participant);
      refreshTiles(room);
    });
    room.on(RoomEvent.TrackUnpublished, (_pub, participant) => {
      syncParticipant(participant);
      refreshTiles(room);
    });
    room.on(RoomEvent.TrackMuted, (_pub, participant) => {
      syncParticipant(participant);
      refreshTiles(room);
    });
    room.on(RoomEvent.TrackUnmuted, (_pub, participant) => {
      syncParticipant(participant);
      refreshTiles(room);
    });
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      store.setMedia(participant.identity, {
        speaking: false,
        camera: false,
        screen: false,
      });
      refreshTiles(room);
    });
    room.on(RoomEvent.LocalTrackPublished, (_pub: LocalTrackPublication) => {
      syncParticipant(room.localParticipant);
      _pub.track?.mediaStreamTrack?.addEventListener("ended", () => refreshTiles(room), { once: true });
      refreshTiles(room);
    });
    room.on(RoomEvent.LocalTrackUnpublished, () => {
      syncParticipant(room.localParticipant);
      refreshTiles(room);
    });
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const ids = new Set(speakers.map((item) => item.identity));
      store.setMedia(room.localParticipant.identity, {
        speaking: ids.has(room.localParticipant.identity),
      });
      room.remoteParticipants.forEach((participant) => {
        store.setMedia(participant.identity, { speaking: ids.has(participant.identity) });
      });
    });
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      store.setMedia(participant.identity, {
        quality: mapQuality(quality),
        adaptive: quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost,
      });
    });
    room.on(RoomEvent.TrackStreamStateChanged, (pub, state, participant) => {
      if (pub.kind === Track.Kind.Video && state === Track.StreamState.Paused) {
        store.setMedia(participant.identity, { adaptive: true });
      }
      if (pub.kind === Track.Kind.Video && state === Track.StreamState.Active) {
        store.setMedia(participant.identity, { adaptive: false });
      }
    });
    room.on(RoomEvent.Reconnecting, () => {
      store.setLivekitStatus("reconnecting");
      toast.message(i18n.t("theater.reconnecting"));
    });
    room.on(RoomEvent.Reconnected, () => {
      store.setLivekitStatus("connected");
      toast.success(i18n.t("theater.reconnected"));
    });
    room.on(RoomEvent.Disconnected, () => {
      if (!stopped) store.setLivekitStatus("unavailable");
    });
    room.on(RoomEvent.MediaDevicesError, () => {
      toast.error(i18n.t("toast.mediaError"));
    });
    room.on(RoomEvent.ParticipantConnected, (participant) => syncParticipant(participant));

    const run = async () => {
      try {
        const creds =
          useRoomStore.getState().livekitCreds ?? (await getLivekitToken(roomId));
        if (stopped) return;
        if (!creds) {
          store.setLivekitStatus("unavailable");
          toast.error(i18n.t("toast.livekitFailed"));
          return;
        }
        await room.connect(creds.url, creds.token);
        if (stopped) {
          await room.disconnect();
          return;
        }
        store.setLivekitStatus("connected");
        await applySavedDevices(room);
        syncParticipant(room.localParticipant);
        room.remoteParticipants.forEach(syncParticipant);
        refreshTiles(room);
      } catch {
        if (!stopped) {
          store.setLivekitStatus("unavailable");
          toast.error(i18n.t("toast.livekitFailed"));
        }
      }
    };
    void run();

    return () => {
      stopped = true;
      store.setLivekitStatus("idle");
      store.resetMedia();
      store.setLocalMediaFlags({ micEnabled: false, cameraEnabled: false, screenEnabled: false });
      void room.disconnect();
      roomRef.current = null;
      setTiles([]);
    };
  }, [roomId, enabled, refreshTiles, syncParticipant]);

  const setMic = async (enabledMic: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(enabledMic);
    if (enabledMic) applyInputVolume(room, readDevicePrefs().inputVolume);
    useRoomStore.getState().setLocalMediaFlags({ micEnabled: enabledMic });
  };

  const setCamera = async (enabledCam: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setCameraEnabled(enabledCam);
    useRoomStore.getState().setLocalMediaFlags({ cameraEnabled: enabledCam });
    refreshTiles(room);
  };

  const setScreen = async (enabledShare: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(enabledShare);
    useRoomStore.getState().setLocalMediaFlags({ screenEnabled: enabledShare });
    refreshTiles(room);
  };

  const listDevices = async () => {
    const [audioinput, audiooutput, videoinput] = await Promise.all([
      Room.getLocalDevices("audioinput"),
      Room.getLocalDevices("audiooutput"),
      Room.getLocalDevices("videoinput"),
    ]);
    return { audioinput, audiooutput, videoinput };
  };

  const switchDevice = async (kind: MediaDeviceKindName, deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    await room.switchActiveDevice(kind, deviceId);
  };

  const setOutputVolume = (volume: number) => {
    const room = roomRef.current;
    if (!room) return;
    applyRemoteVolume(room, volume);
  };

  const setInputVolume = (volume: number) => {
    const room = roomRef.current;
    if (!room) return;
    applyInputVolume(room, volume);
  };

  return { tiles, setMic, setCamera, setScreen, listDevices, switchDevice, setOutputVolume, setInputVolume };
}
