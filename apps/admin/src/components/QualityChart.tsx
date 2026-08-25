import { LineChart } from "@mantine/charts";
import { Paper, Stack, Text } from "@mantine/core";
import type { AdminLabeledSeries } from "@coliseum/shared";
import { useTranslation } from "react-i18next";
import { formatTimestamp, trackSourceLabel } from "../lib/format.ts";

const SOURCE_COLORS: Record<string, string> = {
  microphone: "amber.5",
  camera: "pulse.4",
  screen: "orange.6",
  screenAudio: "cyan.6",
  unknown: "gray.5",
};

function rowsFor(series: AdminLabeledSeries[], locale: string, keyFrom: (item: AdminLabeledSeries) => string) {
  const byTs = new Map<number, Record<string, string | number>>();
  for (const item of series) {
    const key = keyFrom(item);
    for (const point of item.points) {
      const row = byTs.get(point.ts) ?? { label: formatTimestamp(point.ts, locale), ts: point.ts };
      row[key] = point.value;
      byTs.set(point.ts, row);
    }
  }
  return [...byTs.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

export function QualityChart({ series }: { series: AdminLabeledSeries[] }) {
  const { t, i18n } = useTranslation();
  const loss = series.filter((item) => item.name === "livekit_packet_loss_total");
  const latency = series.filter((item) => item.name === "livekit_forward_latency");
  const lossRows = rowsFor(loss, i18n.language, (item) =>
    trackSourceLabel(item.labels.source ?? item.labels.kind ?? "unknown"),
  );
  const latencyRows = rowsFor(latency, i18n.language, () => "latency");
  const sources = [...new Set(loss.map((item) => trackSourceLabel(item.labels.source ?? "unknown")))];

  return (
    <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
      <Stack gap="md">
        <Text fw={600}>{t("overview.qualityChart")}</Text>
        {lossRows.length === 0 && latencyRows.length === 0 ? (
          <Text size="sm" c="var(--admin-on-variant)">
            {t("overview.qualityEmpty")}
          </Text>
        ) : null}
        {lossRows.length > 0 ? (
          <Stack gap={6}>
            <Text size="sm" c="var(--admin-on-variant)">
              {t("overview.loss")}
            </Text>
            <LineChart
              h={220}
              data={lossRows}
              dataKey="label"
              withLegend
              series={sources.map((source) => ({
                name: source,
                label: t(`tracks.${source}`),
                color: SOURCE_COLORS[source] ?? "gray.5",
              }))}
            />
          </Stack>
        ) : null}
        {latencyRows.length > 0 ? (
          <Stack gap={6}>
            <Text size="sm" c="var(--admin-on-variant)">
              {t("overview.rtt")}
            </Text>
            <LineChart
              h={220}
              data={latencyRows}
              dataKey="label"
              withLegend
              series={[{ name: "latency", label: t("overview.rtt"), color: "pulse.4" }]}
            />
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
