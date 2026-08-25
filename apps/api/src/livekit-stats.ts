import type { AdminRoomLivekitSnapshot, AdminTrackBreakdown } from "@coliseum/shared";
import { TrackSource, type ParticipantInfo, type TrackInfo } from "livekit-server-sdk";

export function emptyTracks(): AdminTrackBreakdown {
  return { microphone: 0, camera: 0, screenShare: 0, screenShareAudio: 0, unknown: 0 };
}

function sourceKey(source: TrackInfo["source"]): keyof AdminTrackBreakdown {
  const value = typeof source === "number" ? source : String(source).toUpperCase();
  if (value === TrackSource.MICROPHONE || value === "MICROPHONE" || value === "2") return "microphone";
  if (value === TrackSource.CAMERA || value === "CAMERA" || value === "1") return "camera";
  if (value === TrackSource.SCREEN_SHARE || value === "SCREEN_SHARE" || value === "3") return "screenShare";
  if (value === TrackSource.SCREEN_SHARE_AUDIO || value === "SCREEN_SHARE_AUDIO" || value === "4") {
    return "screenShareAudio";
  }
  return "unknown";
}

function announcedBitrateBps(track: TrackInfo): number {
  const codecLayers = track.codecs?.flatMap((codec) => codec.layers ?? []) ?? [];
  const layers = codecLayers.length > 0 ? codecLayers : (track.layers ?? []);
  let max = 0;
  for (const layer of layers) {
    if (typeof layer.bitrate === "number" && layer.bitrate > max) max = layer.bitrate;
  }
  return max;
}

export function livekitSnapshotFromParticipants(participants: ParticipantInfo[]): AdminRoomLivekitSnapshot {
  const tracks = emptyTracks();
  let announced = 0;
  let publishers = 0;
  for (const participant of participants) {
    const published = participant.tracks ?? [];
    if (published.length > 0) publishers += 1;
    for (const track of published) {
      if (track.muted) continue;
      tracks[sourceKey(track.source)] += 1;
      announced += announcedBitrateBps(track);
    }
  }
  const others = Math.max(0, participants.length - 1);
  const estimatedFanoutBps = announced * others;
  return {
    participants: participants.length,
    publishers,
    tracks,
    announcedBitrateBps: announced || null,
    estimatedFanoutBps: estimatedFanoutBps || null,
    estimated: true,
  };
}
