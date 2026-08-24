export type LogFields = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", msg: string, fields?: LogFields): void {
  const line = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  };
  const encoded = JSON.stringify(line);
  if (level === "error") {
    console.error(encoded);
    return;
  }
  if (level === "warn") {
    console.warn(encoded);
    return;
  }
  console.log(encoded);
}

export const logger = {
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => emit("error", msg, fields),
};
