export type PromSample = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

function parseLabels(raw: string): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!raw.trim()) return labels;
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null = re.exec(raw);
  while (match) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) {
      labels[key] = value.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    match = re.exec(raw);
  }
  return labels;
}

/** Parse Prometheus text exposition. Ignores HELP/TYPE comments and histogram buckets. */
export function parsePrometheusText(text: string): PromSample[] {
  const out: PromSample[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+([^\s]+)(?:\s+\d+)?$/.exec(line);
    if (!match?.[1] || match[4] === undefined) continue;
    const name = match[1];
    if (name.endsWith("_bucket")) continue;
    const value = Number(match[4]);
    if (!Number.isFinite(value)) continue;
    out.push({ name, labels: parseLabels(match[3] ?? ""), value });
  }
  return out;
}

export function labelsKey(labels: Record<string, string>): string {
  return Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join(",");
}
