const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

/** Owner id for operator-provisioned rooms until the first guest joins. */
export const PROVISIONED_OWNER_ID = "__provisioned__";

function randomFrom(alphabet: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const byte = bytes[i] ?? 0;
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

export function newRoomId(): string {
  return randomFrom(ROOM_ALPHABET, 8);
}

export function newStreamSecret(): string {
  return randomFrom(ROOM_ALPHABET, 10);
}

export function composeStreamKey(roomId: string, secret = newStreamSecret()): string {
  return `${roomId}-${secret}`;
}

export function newUserId(): string {
  return crypto.randomUUID();
}

export function newMessageId(): string {
  return crypto.randomUUID();
}
