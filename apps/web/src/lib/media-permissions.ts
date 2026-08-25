export type MediaFailureReason =
  | "denied"
  | "not_found"
  | "in_use"
  | "insecure"
  | "unsupported"
  | "unknown";

export type MediaPermissionKind = "microphone" | "camera";

export type MediaPermissionState = "granted" | "denied" | "prompt" | "unknown";

function errorName(err: unknown): string {
  let current: unknown = err;
  for (let i = 0; i < 4 && current; i += 1) {
    if (typeof DOMException !== "undefined" && current instanceof DOMException) {
      return current.name;
    }
    if (current instanceof Error) {
      if (current.name && current.name !== "Error") return current.name;
      current = current.cause;
      continue;
    }
    break;
  }
  return "";
}

export function classifyGetUserMediaError(err: unknown): MediaFailureReason {
  const name = errorName(err);
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "not_found";
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "in_use";
  if (name === "SecurityError") return "insecure";
  return "unknown";
}

export function mediaFailureToastKey(reason: MediaFailureReason): string {
  switch (reason) {
    case "denied":
      return "toast.mediaDenied";
    case "not_found":
      return "toast.mediaNotFound";
    case "in_use":
      return "toast.mediaInUse";
    case "insecure":
      return "toast.mediaInsecure";
    case "unsupported":
      return "toast.mediaUnsupported";
    default:
      return "toast.mediaError";
  }
}

export async function queryMediaPermission(kind: MediaPermissionKind): Promise<MediaPermissionState> {
  const permissions = navigator.permissions;
  if (!permissions?.query) return "unknown";
  try {
    const status = await permissions.query({ name: kind } as PermissionDescriptor);
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop();
}

export async function requestMediaPermission(kind: MediaPermissionKind): Promise<MediaFailureReason | "granted"> {
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      kind === "microphone" ? { audio: true, video: false } : { audio: false, video: true },
    );
    stopStream(stream);
    return "granted";
  } catch (err) {
    return classifyGetUserMediaError(err);
  }
}
