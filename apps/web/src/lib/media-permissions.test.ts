import { describe, expect, test } from "bun:test";
import { classifyGetUserMediaError, mediaFailureToastKey } from "./media-permissions.ts";

describe("classifyGetUserMediaError", () => {
  test("maps permission denial so the UI can ask the user to allow access", () => {
    expect(classifyGetUserMediaError(new DOMException("Permission denied", "NotAllowedError"))).toBe(
      "denied",
    );
    expect(mediaFailureToastKey("denied")).toBe("toast.mediaDenied");
  });

  test("maps missing hardware and busy devices", () => {
    expect(classifyGetUserMediaError(new DOMException("missing", "NotFoundError"))).toBe("not_found");
    expect(classifyGetUserMediaError(new DOMException("busy", "NotReadableError"))).toBe("in_use");
    expect(classifyGetUserMediaError(new DOMException("insecure", "SecurityError"))).toBe("insecure");
  });
});
