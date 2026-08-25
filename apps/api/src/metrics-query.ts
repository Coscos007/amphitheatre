import type { Database } from "bun:sqlite";
import {
  DEFAULT_ADMIN_TIME_RANGE,
  adminTimeRangeMs,
  type AdminLabeledSeries,
  type AdminLivekitNodeMetrics,
  type AdminOmeStreamMetrics,
  type AdminOverview,
  type AdminRoomMetrics,
  type AdminSeriesPoint,
  type AdminTimeRange,
} from "@coliseum/shared";
import {
  countAllRooms,
  countOccupiedRooms,
  countPeopleNow,
  latestOverviewSample,
  listLivekitSamples,
  listOmeSamples,
  listOverviewSamples,
  listRoomSamples,
  maxPeakMembers,
  type LivekitSampleRow,
  type OmeSampleRow,
  type OverviewSampleRow,
  type RoomSampleRow,
} from "./db";
import { labelsKey } from "./prom-parse";
import type { AdminRoomRow } from "@coliseum/shared";

function bucketMs(range: AdminTimeRange): number {
  switch (range) {
    case "1h":
      return 60_000;
    case "6h":
      return 2 * 60_000;
    case "24h":
      return 5 * 60_000;
    case "7d":
      return 30 * 60_000;
    case "30d":
      return 2 * 60 * 60_000;
  }
}

function downsample(points: AdminSeriesPoint[], bucket: number): AdminSeriesPoint[] {
  if (points.length === 0) return [];
  const buckets = new Map<number, { sum: number; n: number }>();
  for (const point of points) {
    const key = Math.floor(point.ts / bucket) * bucket;
    const current = buckets.get(key) ?? { sum: 0, n: 0 };
    current.sum += point.value;
    current.n += 1;
    buckets.set(key, current);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, { sum, n }]) => ({ ts, value: sum / n }));
}

function counterRates(rows: LivekitSampleRow[]): AdminLabeledSeries[] {
  const groups = new Map<string, LivekitSampleRow[]>();
  for (const row of rows) {
    if (row.kind !== "counter") continue;
    const key = `${row.name}|${row.labels_json}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  const series: AdminLabeledSeries[] = [];
  for (const [, list] of groups) {
    const sorted = [...list].sort((a, b) => a.ts - b.ts);
    const points: AdminSeriesPoint[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      const dt = (cur.ts - prev.ts) / 1000;
      if (dt <= 0) continue;
      const delta = cur.value - prev.value;
      if (delta < 0) continue;
      const perSec = delta / dt;
      const isBytes = cur.name.includes("bytes");
      points.push({ ts: cur.ts, value: isBytes ? perSec * 8 : perSec });
    }
    const first = sorted[0];
    if (!first || points.length === 0) continue;
    let labels: Record<string, string> = {};
    try {
      labels = JSON.parse(first.labels_json) as Record<string, string>;
    } catch {
      labels = {};
    }
    series.push({
      key: `${first.name}:${labelsKey(labels)}`,
      name: first.name,
      labels,
      points,
      unit: first.name.includes("bytes") ? "bps" : "count",
      kind: "counter_rate",
    });
  }
  return series;
}

function gaugeSeries(rows: LivekitSampleRow[]): AdminLabeledSeries[] {
  const groups = new Map<string, LivekitSampleRow[]>();
  for (const row of rows) {
    if (row.kind !== "gauge") continue;
    const key = `${row.name}|${row.labels_json}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  const series: AdminLabeledSeries[] = [];
  for (const [, list] of groups) {
    const first = list[0];
    if (!first) continue;
    let labels: Record<string, string> = {};
    try {
      labels = JSON.parse(first.labels_json) as Record<string, string>;
    } catch {
      labels = {};
    }
    series.push({
      key: `${first.name}:${labelsKey(labels)}`,
      name: first.name,
      labels,
      points: [...list].sort((a, b) => a.ts - b.ts).map((row) => ({ ts: row.ts, value: row.value })),
      unit: first.name.includes("latency") || first.name === "livekit_forward_jitter" ? "ms" : "count",
      kind: "gauge",
    });
  }
  return series;
}

function lastRate(series: AdminLabeledSeries[], pred: (item: AdminLabeledSeries) => boolean): number | null {
  let total = 0;
  let found = false;
  for (const item of series) {
    if (!pred(item)) continue;
    const last = item.points[item.points.length - 1];
    if (!last) continue;
    total += last.value;
    found = true;
  }
  return found ? total : null;
}

function omeThroughputSeries(rows: OmeSampleRow[], field: "throughput_in" | "throughput_out"): AdminLabeledSeries[] {
  const groups = new Map<string, OmeSampleRow[]>();
  for (const row of rows) {
    const key = row.room_id ?? row.stream_key;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, list]) => ({
    key: `ome.${field}:${key}`,
    name: field === "throughput_in" ? "ome_throughput_in" : "ome_throughput_out",
    labels: { roomId: list[0]?.room_id ?? "", streamKey: list[0]?.stream_key ?? key },
    points: [...list].sort((a, b) => a.ts - b.ts).map((row) => ({ ts: row.ts, value: row[field] * 8 })),
    unit: "bps" as const,
    kind: "gauge" as const,
  }));
}

function overviewLine(
  rows: OverviewSampleRow[],
  name: string,
  pick: (row: OverviewSampleRow) => number | null,
  unit: AdminLabeledSeries["unit"],
  asRateFromBytes = false,
): AdminLabeledSeries {
  if (!asRateFromBytes) {
    return {
      key: name,
      name,
      labels: {},
      points: rows
        .map((row) => {
          const value = pick(row);
          return value === null ? null : { ts: row.ts, value };
        })
        .filter((point): point is AdminSeriesPoint => point !== null),
      unit,
      kind: "gauge",
    };
  }
  const points: AdminSeriesPoint[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const cur = rows[i];
    if (!prev || !cur) continue;
    const a = pick(prev);
    const b = pick(cur);
    if (a === null || b === null) continue;
    const dt = (cur.ts - prev.ts) / 1000;
    if (dt <= 0 || b < a) continue;
    points.push({ ts: cur.ts, value: ((b - a) / dt) * 8 });
  }
  return { key: name, name, labels: {}, points, unit: "bps", kind: "counter_rate" };
}

export function queryLivekitMetrics(db: Database, range: AdminTimeRange): AdminLivekitNodeMetrics {
  const since = Date.now() - adminTimeRangeMs(range);
  const rows = listLivekitSamples(db, since);
  const bucket = bucketMs(range);
  const series = [...counterRates(rows), ...gaugeSeries(rows)].map((item) => ({
    ...item,
    points: downsample(item.points, bucket),
  }));
  const latest = latestOverviewSample(db);
  return {
    range,
    metricsReachable: latest ? latest.livekit_metrics_reachable === 1 : series.length > 0,
    bitrateInBps: lastRate(series, (item) => item.name === "livekit_packet_bytes" && item.labels.direction === "incoming"),
    bitrateOutBps: lastRate(series, (item) => item.name === "livekit_packet_bytes" && item.labels.direction === "outgoing"),
    series,
  };
}

export function queryOmeMetrics(db: Database, range: AdminTimeRange): AdminOmeStreamMetrics {
  const since = Date.now() - adminTimeRangeMs(range);
  const rows = listOmeSamples(db, since);
  const bucket = bucketMs(range);
  const latestByKey = new Map<string, OmeSampleRow>();
  for (const row of rows) {
    latestByKey.set(row.stream_key, row);
  }
  const series = [...omeThroughputSeries(rows, "throughput_in"), ...omeThroughputSeries(rows, "throughput_out")].map(
    (item) => ({ ...item, points: downsample(item.points, bucket) }),
  );
  const latest = latestOverviewSample(db);
  return {
    range,
    reachable: latest ? latest.ome_reachable === 1 : rows.length > 0,
    streams: [...latestByKey.values()].map((row) => ({
      roomId: row.room_id,
      streamKey: row.stream_key,
      live: row.total_connections > 0 || row.throughput_in > 0 || row.throughput_out > 0,
      throughputInBps: row.throughput_in * 8,
      throughputOutBps: row.throughput_out * 8,
      bytesIn: row.bytes_in,
      bytesOut: row.bytes_out,
      connectionsWebrtc: row.connections_webrtc,
      connectionsLlhls: row.connections_llhls,
      totalConnections: row.total_connections,
    })),
    series,
  };
}

export function queryOverview(db: Database, range: AdminTimeRange = DEFAULT_ADMIN_TIME_RANGE): AdminOverview {
  const since = Date.now() - adminTimeRangeMs(range);
  const overviews = listOverviewSamples(db, since);
  const livekit = queryLivekitMetrics(db, range);
  const ome = queryOmeMetrics(db, range);
  const latest = latestOverviewSample(db);
  const bucket = bucketMs(range);
  const livekitSeries = [
    overviewLine(overviews, "livekit_bitrate_in", (row) => row.livekit_bytes_in, "bps", true),
    overviewLine(overviews, "livekit_bitrate_out", (row) => row.livekit_bytes_out, "bps", true),
  ].map((item) => ({ ...item, points: downsample(item.points, bucket) }));
  const omeSeries = [
    overviewLine(overviews, "ome_bitrate_in", (row) => row.ome_bytes_in, "bps", true),
    overviewLine(overviews, "ome_bitrate_out", (row) => row.ome_bytes_out, "bps", true),
  ].map((item) => ({ ...item, points: downsample(item.points, bucket) }));
  return {
    range,
    roomsTotal: countAllRooms(db),
    roomsOccupied: countOccupiedRooms(db),
    peopleNow: countPeopleNow(db),
    peakPeople: maxPeakMembers(db),
    livekit: {
      metricsReachable: livekit.metricsReachable,
      bitrateInBps: livekit.bitrateInBps,
      bitrateOutBps: livekit.bitrateOutBps,
      series: livekitSeries,
    },
    ome: {
      configured: Boolean(latest) || ome.streams.length > 0,
      healthy: latest ? latest.ome_reachable === 1 : ome.reachable,
      reachable: ome.reachable,
      bitrateInBps: lastRate(ome.series, (item) => item.name === "ome_throughput_in"),
      bitrateOutBps: lastRate(ome.series, (item) => item.name === "ome_throughput_out"),
      series: omeSeries,
    },
  };
}

export function queryRoomMetrics(db: Database, room: AdminRoomRow, range: AdminTimeRange): AdminRoomMetrics {
  const since = Date.now() - adminTimeRangeMs(range);
  const roomRows = listRoomSamples(db, since, room.id);
  const omeRows = listOmeSamples(db, since, room.id);
  const bucket = bucketMs(range);

  const roomSeriesFrom = (name: string, pick: (row: RoomSampleRow) => number, estimated = false): AdminLabeledSeries => ({
    key: `${name}:${room.id}`,
    name,
    labels: { roomId: room.id },
    points: downsample(
      [...roomRows].sort((a, b) => a.ts - b.ts).map((row) => ({ ts: row.ts, value: pick(row) })),
      bucket,
    ),
    unit: name.includes("bps") ? "bps" : "count",
    kind: "gauge",
    estimated,
  });

  const series: AdminLabeledSeries[] = [
    roomSeriesFrom("present", (row) => row.present),
    roomSeriesFrom("livekit_participants", (row) => row.lk_participants),
    roomSeriesFrom("tracks_microphone", (row) => row.tracks_mic),
    roomSeriesFrom("tracks_camera", (row) => row.tracks_camera),
    roomSeriesFrom("tracks_screen", (row) => row.tracks_screen),
    roomSeriesFrom("announced_bitrate_bps", (row) => row.announced_bitrate_bps, true),
    roomSeriesFrom("estimated_fanout_bps", (row) => row.estimated_fanout_bps, true),
    ...omeThroughputSeries(omeRows, "throughput_in"),
    ...omeThroughputSeries(omeRows, "throughput_out"),
  ];

  return { range, room, series };
}

export { DEFAULT_ADMIN_TIME_RANGE };
