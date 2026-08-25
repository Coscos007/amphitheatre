import { AreaChart } from "@mantine/charts";
import { Paper, Text } from "@mantine/core";
import type { AdminLabeledSeries } from "@coliseum/shared";
import { useTranslation } from "react-i18next";
import { mergeNamedSeries } from "../lib/charts.ts";
import { formatBps } from "../lib/format.ts";

export function BitrateChart({
  title,
  series,
  inboundName,
  outboundName,
}: {
  title: string;
  series: AdminLabeledSeries[];
  inboundName: string;
  outboundName: string;
}) {
  const { t, i18n } = useTranslation();
  const data = mergeNamedSeries(
    series,
    [
      { name: inboundName, key: "inbound" },
      { name: outboundName, key: "outbound" },
    ],
    i18n.language,
  );
  return (
    <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
      <Text fw={600} mb="sm">
        {title}
      </Text>
      {data.length === 0 ? (
        <Text size="sm" c="var(--admin-on-variant)">
          {t("app.loading")}
        </Text>
      ) : (
        <AreaChart
          h={260}
          data={data}
          dataKey="label"
          withGradient
          withLegend
          valueFormatter={(value) => formatBps(value)}
          series={[
            { name: "inbound", label: t("overview.inbound"), color: "amber.5" },
            { name: "outbound", label: t("overview.outbound"), color: "pulse.4" },
          ]}
        />
      )}
    </Paper>
  );
}
