import { Badge, Group, Stack, Switch, Table, Text, Title, Tooltip, ActionIcon } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { fetchRooms } from "../lib/api.ts";
import { formatCount } from "../lib/format.ts";
import { inputEventChecked } from "../lib/input-value.ts";
import { POLL_MS } from "../lib/queries.ts";

export function RoomsPage() {
  const { t } = useTranslation();
  const [hideEmpty, setHideEmpty] = useState(false);
  const rooms = useQuery({
    queryKey: ["admin-rooms", hideEmpty],
    queryFn: () => fetchRooms(hideEmpty),
    refetchInterval: POLL_MS,
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={1}>{t("rooms.title")}</Title>
        <Switch
          label={t("rooms.hideEmpty")}
          description={t("rooms.hideEmptyHint")}
          checked={hideEmpty}
          onChange={(event) => setHideEmpty(inputEventChecked(event))}
        />
      </Group>
      {rooms.error ? <ErrorAlert error={rooms.error} /> : null}
      {rooms.isLoading ? (
        <Text c="var(--admin-on-variant)">{t("app.loading")}</Text>
      ) : !rooms.data || rooms.data.length === 0 ? (
        <Text c="var(--admin-on-variant)">{t("rooms.empty")}</Text>
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("rooms.name")}</Table.Th>
                <Table.Th>{t("rooms.id")}</Table.Th>
                <Table.Th>{t("rooms.visibility")}</Table.Th>
                <Table.Th>
                  <Group gap={4} wrap="nowrap">
                    {t("rooms.occupancy")}
                    <Tooltip
                      label={t("rooms.occupancyHint")}
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
                <Table.Th>
                  <Group gap={4} wrap="nowrap">
                    {t("rooms.tracks")}
                    <Tooltip
                      label={t("rooms.tracksHint")}
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
                <Table.Th>{t("rooms.ome")}</Table.Th>
                <Table.Th>{t("rooms.broadcast")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rooms.data.map((room) => {
                const tracks = room.livekit?.tracks;
                const trackTotal = tracks
                  ? tracks.microphone + tracks.camera + tracks.screenShare + tracks.screenShareAudio
                  : 0;
                return (
                  <Table.Tr key={room.id}>
                    <Table.Td>
                      <Link to="/rooms/$roomId" params={{ roomId: room.id }}>
                        {room.name}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      <Text ff="Quicksand, sans-serif" size="sm">
                        {room.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={room.isPublic ? "pulse" : "gray"} tt="none">
                        {room.isPublic ? t("rooms.public") : t("rooms.private")}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {formatCount(room.present)} / {formatCount(room.uniqueEver)} / {formatCount(room.peak)}
                    </Table.Td>
                    <Table.Td>{formatCount(trackTotal)}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={room.ome?.live ? "pulse" : "gray"} tt="none">
                        {room.ome?.live ? t("rooms.live") : t("rooms.offline")}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{room.broadcast.enabled ? room.broadcast.provider : t("rooms.offline")}</Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
