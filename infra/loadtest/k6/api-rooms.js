# k6 — API room create/join/brute-force (Hono on :3001, not started by infra).
#   k6 run -e API_BASE=http://localhost:3001 infra/loadtest/k6/api-rooms.js
#
# Success criteria and ramps: docs/load-testing.md
import http from "k6/http";
import { check, sleep, fail } from "k6";
import { Rate, Counter } from "k6/metrics";

const API = __ENV.API_BASE || "http://localhost:3001";
const banned = new Rate("join_banned");
const created = new Counter("rooms_created");

export const options = {
  scenarios: {
    create_join: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 25 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
      exec: "createAndJoin",
    },
    brute_force: {
      executor: "per-vu-iterations",
      vus: 5,
      iterations: 1,
      exec: "passwordBruteForce",
      startTime: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500"],
  },
};

function json(res) {
  try {
    return res.json();
  } catch {
    return {};
  }
}

export function createAndJoin() {
  const create = http.post(
    `${API}/rooms`,
    JSON.stringify({
      name: `load-${__VU}-${__ITER}`,
      maxUsers: 50,
      password: "correct-horse",
      voiceEnabled: true,
      videoEnabled: true,
      screenShareEnabled: true,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(create, { "create 2xx": (r) => r.status >= 200 && r.status < 300 });
  if (create.status >= 200 && create.status < 300) created.add(1);
  const roomId = json(create).roomId;
  if (!roomId) {
    sleep(1);
    return;
  }
  const join = http.post(
    `${API}/rooms/${roomId}/join`,
    JSON.stringify({ password: "correct-horse", displayName: `vu-${__VU}` }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(join, { "join 2xx": (r) => r.status >= 200 && r.status < 300 });
  sleep(1);
}

export function passwordBruteForce() {
  const create = http.post(
    `${API}/rooms`,
    JSON.stringify({
      name: `ban-${__VU}`,
      maxUsers: 8,
      password: "real-password",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
  const roomId = json(create).roomId;
  if (!roomId) fail("could not create room for brute-force scenario");

  let lastStatus = 0;
  for (let i = 0; i < 4; i += 1) {
    const join = http.post(
      `${API}/rooms/${roomId}/join`,
      JSON.stringify({ password: `wrong-${i}`, displayName: "attacker" }),
      { headers: { "Content-Type": "application/json" } },
    );
    lastStatus = join.status;
  }
  // Product rule: 3 failures → 5 minute ban. The 4th attempt must be 429/403, not 401.
  const bannedNow = lastStatus === 429 || lastStatus === 403;
  banned.add(bannedNow);
  check(null, { "4th bad password is banned": () => bannedNow });
}
