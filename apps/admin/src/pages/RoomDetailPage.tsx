import { AreaChart } from "@mantine/charts";
import { ActionIcon, Anchor, Badge, Group, Paper, SimpleGrid, Stack, Table, Text, Title, Tooltip } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { DEFAULT_ADMIN_TIME_RANGE, type AdminTimeRange } from "@coliseum/shared";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { KpiCard } from "../components/KpiCard.tsx";
import { RangeControl } from "../components/RangeControl.tsx";
import { mergeNamedSeries } from "../lib/charts.ts";
import { AdminApiError, fetchRoom, fetchRoomMetrics } from "../lib/api.ts";
import { formatBps, formatCount } from "../lib/format.ts";
import { POLL_MS } from "../lib/queries.ts";

export function RoomDetailPage() {
  const { t, i18n } = useTranslation();
  const { roomId } = useParams({ from: "/shell/rooms/$roomId" });
  const [range, setRange] = useState<AdminTimeRange>(DEFAULT_ADMIN_TIME_RANGE);
  const room = useQuery({
    queryKey: ["admin-room", roomId],
    queryFn: () => fetchRoom(roomId),
    refetchInterval: POLL_MS,
  });
  const metrics = useQuery({
    queryKey: ["admin-room-metrics", roomId, range],
    queryFn: () => fetchRoomMetrics(roomId, range),
    refetchInterval: POLL_MS,
  });
  const data = room.data;
  const chart = mergeNamedSeries(
    metrics.data?.series ?? [],
    [
      { name: "present", key: "present" },
      { name: "estimated_fanout_bps", key: "fanout" },
    ],
    i18n.language,
  );

  if (room.error instanceof AdminApiError && room.error.status === 404) {
    return (
      <Stack>
        <Title order={1}>{t("room.title")}</Title>
        <Text>{t("room.missing")}</Text>
        <Anchor component={Link} to="/rooms">
          {t("room.back")}
        </Anchor>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <div>
          <Anchor component={Link} to="/rooms">
            {t("room.back")}
          </Anchor>
          <Title order={1}>{data?.name ?? t("room.title")}</Title>
          <Text ff="Quicksand, sans-serif" c="var(--admin-on-variant)">
            {roomId}
          </Text>
        </div>
        <RangeControl value={range} onChange={setRange} />
      </Group>
      {room.error ? <ErrorAlert error={room.error} /> : null}
      {data ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <KpiCard
              label={t("room.present")}
              value={formatCount(data.present)}
              tooltip={t("room.presentHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.unique")}
              value={formatCount(data.uniqueEver)}
              tooltip={t("room.uniqueHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.peak")}
              value={formatCount(data.peak)}
              tooltip={t("room.peakHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.fanout")}
              value={formatBps(data.livekit?.estimatedFanoutBps ?? null)}
              hint={t("room.estimateHint")}
              tooltip={t("room.estimateHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.announced")}
              value={formatBps(data.livekit?.announcedBitrateBps ?? null)}
              hint={t("room.estimateHint")}
              tooltip={t("room.estimateHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.microphone")}
              value={formatCount(data.livekit?.tracks.microphone ?? 0)}
              tooltip={t("room.microphoneHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.camera")}
              value={formatCount(data.livekit?.tracks.camera ?? 0)}
              tooltip={t("room.cameraHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.screen")}
              value={formatCount(data.livekit?.tracks.screenShare ?? 0)}
              tooltip={t("room.screenHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.omeWebrtc")}
              value={formatCount(data.ome?.connectionsWebrtc ?? null)}
              tooltip={t("room.omeWebrtcHint")}
              helpLabel={t("app.metricHelp")}
            />
            <KpiCard
              label={t("room.omeLlhls")}
              value={formatCount(data.ome?.connectionsLlhls ?? null)}
              tooltip={t("room.omeLlhlsHint")}
              helpLabel={t("app.metricHelp")}
            />
          </SimpleGrid>
          <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
            <Text size="sm" c="var(--admin-on-variant)">
              {t("room.streamKey")}
            </Text>
            <Text ff="Quicksand, sans-serif">{data.streamKey}</Text>
            <Badge mt="sm" variant="light" tt="none">
              {data.broadcast.enabled ? data.broadcast.provider : t("rooms.offline")}
            </Badge>
          </Paper>
          <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
            <Text fw={600} mb="sm">
              {t("room.chart")}
            </Text>
            {chart.length === 0 ? (
              <Text size="sm" c="var(--admin-on-variant)">
                {t("app.loading")}
              </Text>
            ) : (
              <AreaChart
                h={260}
                data={chart}
                dataKey="label"
                withLegend
                withGradient
                series={[
                  { name: "present", label: t("room.present"), color: "amber.5" },
                  { name: "fanout", label: t("room.fanout"), color: "pulse.4" },
                ]}
              />
            )}
          </Paper>
          <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
            <Text fw={600} mb="sm">
              {t("room.members")}
            </Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("operators.username")}</Table.Th>
                  <Table.Th>{t("room.role")}</Table.Th>
                  <Table.Th>
                    <Group gap={4} wrap="nowrap">
                      {t("room.present")}
                      <Tooltip
                        label={t("room.presentHint")}
                        multiline
                        maw={280}
                        withArrow
                        events={{ hover: true, focus: true, touch: true }}
                      >
                        <ActionIcon variant="subtle" size="sm" color="gray" aria-label={t("app.metricHelp")}>
                          <IconHelp size={16} stroke={1.75} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Th>
                  <Table.Th>{t("room.muted")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data.members ?? []).map((member) => (
                  <Table.Tr key={member.userId}>
                    <Table.Td>{member.displayName}</Table.Td>
                    <Table.Td>{member.role}</Table.Td>
                    <Table.Td>{member.present ? t("room.yes") : t("room.no")}</Table.Td>
                    <Table.Td>{member.muted ? t("room.yes") : t("room.no")}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      ) : null}
    </Stack>
  );
}
