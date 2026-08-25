import type { AdminLabeledSeries } from "@coliseum/shared";
import { formatTimestamp } from "./format.ts";

export type ChartRow = {
  label: string;
  [key: string]: string | number;
};

export function findSeries(series: AdminLabeledSeries[], name: string): AdminLabeledSeries | undefined {
  return series.find((item) => item.name === name);
}

export function mergeNamedSeries(
  series: AdminLabeledSeries[],
  mapping: Array<{ name: string; key: string }>,
  locale: string,
): ChartRow[] {
  const byTs = new Map<number, ChartRow>();
  for (const map of mapping) {
    const item = findSeries(series, map.name);
    if (!item) continue;
    for (const point of item.points) {
      const row = byTs.get(point.ts) ?? { label: formatTimestamp(point.ts, locale), ts: point.ts };
      row[map.key] = point.value;
      byTs.set(point.ts, row);
    }
  }
  return [...byTs.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

export function seriesToRows(item: AdminLabeledSeries, locale: string, valueKey = "value"): ChartRow[] {
  return item.points.map((point) => ({
    label: formatTimestamp(point.ts, locale),
    ts: point.ts,
    [valueKey]: point.value,
  }));
}
