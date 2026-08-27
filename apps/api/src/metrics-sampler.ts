import type { Database } from "bun:sqlite";
import {
  countOccupiedRooms,
  countPeopleNow,
  countPresent,
  countUniqueMembers,
  deleteExpiredRooms,
  getRoom,
  insertLivekitSamples,
  insertOmeSamples,
  insertOverviewSample,
  insertRoomSamples,
  listAllRooms,
  pruneMetrics,
  type LivekitSampleRow,
  type OmeSampleRow,
  type RoomSampleRow,
} from "./db";
import type { Env } from "./env";
import type { Clock } from "./clock";
import type { LivekitService } from "./livekit";
import { livekitSnapshotFromParticipants } from "./livekit-stats";
import { logger } from "./logger";
import type { OmeClient } from "./ome";
import { parsePrometheusText } from "./prom-parse";
import { reconcileStalePresence } from "./presence";
import type { RoomHub } from "./hub";

const LIVEKIT_COUNTERS = new Set([
  "livekit_packet_bytes",
  "livekit_packet_total",
  "livekit_packet_loss_total",
  "livekit_packet_out_of_order_total",
  "livekit_nack_total",
  "livekit_pli_total",
  "livekit_fir_total",
  "livekit_participant_join_total",
  "livekit_track_publish_counter",
  "livekit_track_subscribe_counter",
]);

const LIVEKIT_KEEP = new Set([
  ...LIVEKIT_COUNTERS,
  "livekit_room_total",
  "livekit_participant_total",
  "livekit_track_published_total",
  "livekit_track_subscribed_total",
  "livekit_connection_total",
  "livekit_forward_latency",
  "livekit_forward_jitter",
]);

export type SamplerDeps = {
  db: Database;
  env: Env;
  clock: Clock;
  ome: OmeClient;
  livekit: LivekitService;
  hub?: RoomHub;
  fetchImpl?: typeof fetch;
};

function packetBytes(samples: LivekitSampleRow[], direction: string): number | null {
  let total = 0;
  let found = false;
  for (const sample of samples) {
    if (sample.name !== "livekit_packet_bytes") continue;
    try {
      const labels = JSON.parse(sample.labels_json) as Record<string, string>;
      if (labels.direction === direction) {
        total += sample.value;
        found = true;
      }
    } catch {
      /* ignore */
    }
  }
  return found ? total : null;
}

export async function collectMetricsSample(deps: SamplerDeps): Promise<void> {
  const { db, env, clock, ome, livekit, hub } = deps;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const ts = clock.now();

  if (hub) {
    const marked = reconcileStalePresence(db, hub, ts, env.WS_GRACE_MS);
    if (marked > 0) logger.info("presence_reconcile", { marked });
  }

  const expired = deleteExpiredRooms(db, ts);
  if (expired > 0) logger.info("rooms_expired", { removed: expired });

  let livekitReachable = false;
  const livekitRows: LivekitSampleRow[] = [];
  try {
    const res = await fetchImpl(env.LIVEKIT_METRICS_URL, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      livekitReachable = true;
      const parsed = parsePrometheusText(await res.text());
      for (const sample of parsed) {
        if (!LIVEKIT_KEEP.has(sample.name)) continue;
        livekitRows.push({
          ts,
          name: sample.name,
          labels_json: JSON.stringify(sample.labels),
          value: sample.value,
          kind: LIVEKIT_COUNTERS.has(sample.name) ? "counter" : "gauge",
        });
      }
      insertLivekitSamples(db, livekitRows);
    }
  } catch (err) {
    logger.warn("livekit_metrics_scrape_failed", {
      reason: err instanceof Error ? err.name : "error",
    });
  }

  const listed = await ome.listStreams();
  const omeRows: OmeSampleRow[] = [];
  const roomsByKey = new Map(listAllRooms(db).map((row) => [row.stream_key, row]));
  if (listed.reachable) {
    for (const streamKey of listed.keys) {
      const stats = await ome.streamStats(streamKey);
      omeRows.push({
        ts,
        room_id: roomsByKey.get(streamKey)?.id ?? null,
        stream_key: streamKey,
        bytes_in: stats.totalBytesIn,
        bytes_out: stats.totalBytesOut,
        throughput_in: stats.lastThroughputIn,
        throughput_out: stats.lastThroughputOut,
        connections_webrtc: stats.connectionsWebrtc,
        connections_llhls: stats.connectionsLlhls,
        total_connections: stats.totalConnections,
      });
    }
    insertOmeSamples(db, omeRows);
  }

  const lkRooms = await livekit.listRooms();
  const lkByName = new Map(lkRooms.map((room) => [room.name, room]));
  const sqliteRooms = listAllRooms(db);
  const roomIds = new Set<string>();
  for (const row of sqliteRooms) {
    if (countPresent(db, row.id) > 0) roomIds.add(row.id);
  }
  for (const room of lkRooms) {
    if (room.name) roomIds.add(room.name);
  }
  for (const sample of omeRows) {
    if (sample.room_id) roomIds.add(sample.room_id);
  }

  const roomRows: RoomSampleRow[] = [];
  for (const roomId of roomIds) {
    const row = getRoom(db, roomId);
    const participants = await livekit.listParticipants(roomId);
    const snapshot = livekitSnapshotFromParticipants(participants);
    const lkRoom = lkByName.get(roomId);
    roomRows.push({
      ts,
      room_id: roomId,
      present: row ? countPresent(db, roomId) : snapshot.participants,
      unique_ever: row ? countUniqueMembers(db, roomId) : snapshot.participants,
      peak: row?.peak_members ?? snapshot.participants,
      lk_participants: lkRoom?.numParticipants ?? snapshot.participants,
      tracks_mic: snapshot.tracks.microphone,
      tracks_camera: snapshot.tracks.camera,
      tracks_screen: snapshot.tracks.screenShare,
      tracks_screen_audio: snapshot.tracks.screenShareAudio,
      announced_bitrate_bps: snapshot.announcedBitrateBps ?? 0,
      estimated_fanout_bps: snapshot.estimatedFanoutBps ?? 0,
    });
  }
  insertRoomSamples(db, roomRows);

  const omeBytesIn = omeRows.reduce((sum, row) => sum + row.bytes_in, 0);
  const omeBytesOut = omeRows.reduce((sum, row) => sum + row.bytes_out, 0);

  insertOverviewSample(db, {
    ts,
    rooms_occupied: countOccupiedRooms(db),
    people_now: countPeopleNow(db),
    livekit_bytes_in: packetBytes(livekitRows, "incoming"),
    livekit_bytes_out: packetBytes(livekitRows, "outgoing"),
    ome_bytes_in: listed.reachable ? omeBytesIn : null,
    ome_bytes_out: listed.reachable ? omeBytesOut : null,
    ome_reachable: listed.reachable ? 1 : 0,
    livekit_metrics_reachable: livekitReachable ? 1 : 0,
  });

  pruneMetrics(db, ts - env.METRICS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export function startMetricsSampler(deps: SamplerDeps): { stop: () => void } {
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    void collectMetricsSample(deps).catch((err) => {
      logger.warn("metrics_sample_failed", { reason: err instanceof Error ? err.name : "error" });
    });
  };
  tick();
  const handle = setInterval(tick, deps.env.METRICS_INTERVAL_MS);
  return {
    stop() {
      stopped = true;
      clearInterval(handle);
    },
  };
}
