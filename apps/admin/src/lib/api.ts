import {
  adminPaths,
  type AdminCreateRoomBody,
  type AdminApiKeyRotateResponse,
  type AdminLivekitNodeMetrics,
  type AdminLoginResponse,
  type AdminOmeStreamMetrics,
  type AdminOverview,
  type AdminRoomMetrics,
  type AdminRoomRow,
  type AdminSession,
  type AdminTimeRange,
  type AdminUser,
  type ApiErrorBody,
} from "@coliseum/shared";

export class AdminApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "AdminApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers,
  });
  const json = (await res.json().catch(() => null)) as ApiErrorBody | T | null;
  if (!res.ok) {
    const body: ApiErrorBody =
      json && typeof json === "object" && "error" in json
        ? (json as ApiErrorBody)
        : { error: "internal_error", message: "Request failed" };
    throw new AdminApiError(res.status, body);
  }
  return json as T;
}

export function fetchSession(): Promise<AdminSession> {
  return request(adminPaths.session);
}

export function login(body: { username: string; password: string; apiKey: string }): Promise<AdminLoginResponse> {
  return request(adminPaths.login, { method: "POST", body: JSON.stringify(body) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request(adminPaths.logout, { method: "POST" });
}

export function fetchOverview(range: AdminTimeRange): Promise<AdminOverview> {
  return request(`${adminPaths.overview}?range=${range}`);
}

export function fetchRooms(hideEmpty: boolean): Promise<AdminRoomRow[]> {
  const query = hideEmpty ? "?hideEmpty=true" : "";
  return request(`${adminPaths.rooms}${query}`);
}

export function createRoom(body: AdminCreateRoomBody): Promise<AdminRoomRow> {
  return request(adminPaths.rooms, { method: "POST", body: JSON.stringify(body) });
}

export function fetchRoom(id: string): Promise<AdminRoomRow> {
  return request(adminPaths.room(id));
}

export function fetchRoomMetrics(id: string, range: AdminTimeRange): Promise<AdminRoomMetrics> {
  return request(`${adminPaths.roomMetrics(id)}?range=${range}`);
}

export function fetchLivekitMetrics(range: AdminTimeRange): Promise<AdminLivekitNodeMetrics> {
  return request(`${adminPaths.livekitMetrics}?range=${range}`);
}

export function fetchOmeMetrics(range: AdminTimeRange): Promise<AdminOmeStreamMetrics> {
  return request(`${adminPaths.omeMetrics}?range=${range}`);
}

export function fetchUsers(): Promise<AdminUser[]> {
  return request(adminPaths.users);
}

export function createUser(body: { username: string; password: string }): Promise<AdminUser> {
  return request(adminPaths.users, { method: "POST", body: JSON.stringify(body) });
}

export function patchUser(
  id: string,
  body: { password?: string; disabled?: boolean },
): Promise<AdminUser> {
  return request(adminPaths.user(id), { method: "PATCH", body: JSON.stringify(body) });
}

export function rotateApiKey(): Promise<AdminApiKeyRotateResponse> {
  return request(adminPaths.apiKeyRotate, { method: "POST" });
}

export function factoryReset(phrase: string): Promise<{ ok: true }> {
  return request(adminPaths.factoryReset, { method: "POST", body: JSON.stringify({ phrase }) });
}
