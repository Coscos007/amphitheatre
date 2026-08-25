import { describe, expect, test } from "bun:test";
import { parsePrometheusText } from "../src/prom-parse";
import { collectMetricsSample } from "../src/metrics-sampler";
import { queryOverview } from "../src/metrics-query";
import { loginAdmin, makeAdminHarness, getJson } from "./helpers";

const FIXTURE = `
# HELP livekit_packet_bytes total bytes
# TYPE livekit_packet_bytes counter
livekit_packet_bytes{direction="incoming",transmission="initial",country=""} 1000
livekit_packet_bytes{direction="outgoing",transmission="initial",country=""} 4000
livekit_room_total 2
livekit_packet_loss_total{direction="incoming",source="MICROPHONE",type="AUDIO",country=""} 3
livekit_rtt_ms_bucket{le="50"} 1
`;

describe("prometheus text parser", () => {
  test("parses counters and skips histogram buckets", () => {
    const samples = parsePrometheusText(FIXTURE);
    expect(samples.some((item) => item.name === "livekit_packet_bytes" && item.labels.direction === "incoming")).toBe(
      true,
    );
    expect(samples.some((item) => item.name.endsWith("_bucket"))).toBe(false);
    expect(samples.find((item) => item.name === "livekit_room_total")?.value).toBe(2);
    expect(samples.find((item) => item.name === "livekit_packet_loss_total")?.labels.source).toBe("MICROPHONE");
  });
});

describe("metrics sampler", () => {
  test("overview stays 200 when OME is down", async () => {
    const { admin, deps } = await makeAdminHarness();
    await collectMetricsSample({
      ...deps,
      fetchImpl: (async () => new Response("livekit_room_total 1\n", { status: 200 })) as unknown as typeof fetch,
    });
    const login = await loginAdmin(admin);
    const res = await getJson(admin, "/api/admin/overview", login.token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReturnType<typeof queryOverview>;
    expect(body.ome.reachable).toBe(false);
    expect(body.livekit.metricsReachable).toBe(true);
  });
});
