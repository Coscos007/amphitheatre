import { Alert, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DEFAULT_ADMIN_TIME_RANGE, type AdminTimeRange } from "@coliseum/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BitrateChart } from "../components/BitrateChart.tsx";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { HealthBadge } from "../components/HealthBadge.tsx";
import { KpiCard } from "../components/KpiCard.tsx";
import { QualityChart } from "../components/QualityChart.tsx";
import { RangeControl } from "../components/RangeControl.tsx";
import { fetchLivekitMetrics, fetchOverview } from "../lib/api.ts";
import { formatBps, formatCount } from "../lib/format.ts";
import { POLL_MS } from "../lib/queries.ts";

export function OverviewPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<AdminTimeRange>(DEFAULT_ADMIN_TIME_RANGE);
  const overview = useQuery({
    queryKey: ["admin-overview", range],
    queryFn: () => fetchOverview(range),
    refetchInterval: POLL_MS,
  });
  const livekit = useQuery({
    queryKey: ["admin-livekit", range],
    queryFn: () => fetchLivekitMetrics(range),
    refetchInterval: POLL_MS,
  });
  const data = overview.data;

  return (
    <Stack gap="lg">
      <Title order={1}>{t("overview.title")}</Title>
      <RangeControl value={range} onChange={setRange} />
      {overview.error ? <ErrorAlert error={overview.error} /> : null}
      {data ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <KpiCard
              label={t("overview.roomsOccupied")}
              value={formatCount(data.roomsOccupied)}
              tooltip={t("overview.roomsOccupiedHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.peopleNow")}
              value={formatCount(data.peopleNow)}
              tooltip={t("overview.peopleNowHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.peakPeople")}
              value={formatCount(data.peakPeople)}
              tooltip={t("overview.peakPeopleHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.livekitIn")}
              value={formatBps(data.livekit.bitrateInBps)}
              tooltip={t("overview.livekitInHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.livekitOut")}
              value={formatBps(data.livekit.bitrateOutBps)}
              tooltip={t("overview.livekitOutHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.omeIn")}
              value={formatBps(data.ome.bitrateInBps)}
              tooltip={t("overview.omeInHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("overview.omeOut")}
              value={formatBps(data.ome.bitrateOutBps)}
              tooltip={t("overview.omeOutHint")}
              helpLabel={t("app.metricHelp")}
            />
            <Stack gap="xs" justify="center">
              <Text size="xs" tt="uppercase" ff="Quicksand, sans-serif" fw={600} lts="0.08em">
                {t("overview.livekitHealth")}
              </Text>
              <HealthBadge
                ok={data.livekit.metricsReachable}
                okLabel={t("overview.reachable")}
                failLabel={t("overview.unreachable")}
              />
              <Text size="xs" tt="uppercase" ff="Quicksand, sans-serif" fw={600} lts="0.08em">
                {t("overview.omeHealth")}
              </Text>
              <HealthBadge
                ok={data.ome.healthy}
                okLabel={t("overview.healthy")}
                failLabel={t("overview.down")}
              />
            </Stack>
          </SimpleGrid>
          {!data.livekit.metricsReachable ? (
            <Alert color="orange" variant="light">
              {t("overview.livekitDown")}
            </Alert>
          ) : null}
          {!data.ome.healthy ? (
            <Alert color="orange" variant="light">
              {t("overview.omeDown")}
            </Alert>
          ) : null}
          <Text size="sm" c="var(--admin-on-variant)">
            {t("overview.nodeNote")}
          </Text>
          <BitrateChart
            title={t("overview.livekitChart")}
            series={data.livekit.series}
            inboundName="livekit_bitrate_in"
            outboundName="livekit_bitrate_out"
          />
          <BitrateChart
            title={t("overview.omeChart")}
            series={data.ome.series}
            inboundName="ome_bitrate_in"
            outboundName="ome_bitrate_out"
          />
          <QualityChart series={livekit.data?.series ?? []} />
        </>
      ) : null}
    </Stack>
  );
}
