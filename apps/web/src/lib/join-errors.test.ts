import { describe, expect, test } from "bun:test";
import { ApiError } from "./api.ts";
import { joinErrorMessageKey, isMissingRoomError } from "./join-errors.ts";
import { parseRoomCode } from "./api.ts";

describe("parseRoomCode", () => {
  test("keeps mixed case from invite URLs and typed codes", () => {
    expect(parseRoomCode("Ab3Kxy9m")).toBe("Ab3Kxy9m");
    expect(parseRoomCode("https://example.test/rooms/Ab3Kxy9m")).toBe("Ab3Kxy9m");
  });
});

describe("joinErrorMessageKey", () => {
  test("does not treat a missing room as a wrong password", () => {
    const missing = new ApiError({ status: 404, code: "not_found", message: "gone" });
    expect(isMissingRoomError(missing)).toBe(true);
    expect(joinErrorMessageKey(missing)).toBe("join.notFound");
    const wrong = new ApiError({ status: 403, code: "invalid_password", message: "nope" });
    expect(joinErrorMessageKey(wrong)).toBe("join.invalidPassword");
    const legacy = new ApiError({ status: 403, code: "cannot_join", message: "nope" });
    expect(joinErrorMessageKey(legacy)).toBe("toast.joinFailed");
  });
});
