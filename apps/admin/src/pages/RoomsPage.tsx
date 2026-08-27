import {
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { limits, type AdminCreateRoomBody } from "@coliseum/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { createRoom, fetchRooms } from "../lib/api.ts";
import { formatCount } from "../lib/format.ts";
import { inputEventChecked, inputEventValue } from "../lib/input-value.ts";
import { POLL_MS } from "../lib/queries.ts";

type ExpiryMode = "indefinite" | "24" | "48" | "72" | "168" | "custom";

function expiryHours(mode: ExpiryMode, customHours: number): number | undefined {
  if (mode === "indefinite") return undefined;
  if (mode === "custom") return customHours;
  return Number(mode);
}

export function RoomsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hideEmpty, setHideEmpty] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [memberLimit, setMemberLimit] = useState<number>(limits.memberLimit.max);
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("indefinite");
  const [customHours, setCustomHours] = useState(48);

  const rooms = useQuery({
    queryKey: ["admin-rooms", hideEmpty],
    queryFn: () => fetchRooms(hideEmpty),
    refetchInterval: POLL_MS,
  });

  const createMutation = useMutation({
    mutationFn: (body: AdminCreateRoomBody) => createRoom(body),
    onSuccess: async () => {
      setRoomId("");
      setRoomName("");
      setMemberLimit(limits.memberLimit.max);
      setPassword("");
      setIsPublic(false);
      setExpiryMode("indefinite");
      setCustomHours(48);
      await queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    },
  });

  const expiryOptions: { value: ExpiryMode; label: string }[] = [
    { value: "indefinite", label: t("rooms.expiresIndefinite") },
    { value: "24", label: t("rooms.expiresHours", { hours: 24 }) },
    { value: "48", label: t("rooms.expiresHours", { hours: 48 }) },
    { value: "72", label: t("rooms.expiresHours", { hours: 72 }) },
    { value: "168", label: t("rooms.expiresHours", { hours: 168 }) },
    { value: "custom", label: t("rooms.expiresCustom") },
  ];

  const submitCreate = () => {
    const hours = expiryHours(expiryMode, customHours);
    const body: AdminCreateRoomBody = {
      id: roomId.trim(),
      name: roomName.trim(),
      memberLimit,
      isPublic,
      ...(password.trim() ? { password: password.trim() } : {}),
      ...(hours !== undefined ? { expiresInHours: hours } : {}),
    };
    createMutation.mutate(body);
  };

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

      <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
        <Title order={2} size="h3" mb="xs">
          {t("rooms.createTitle")}
        </Title>
        <Text mb="md" size="sm" c="var(--admin-on-variant)">
          {t("rooms.createLead")}
        </Text>
        {createMutation.error ? <ErrorAlert error={createMutation.error} /> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitCreate();
          }}
        >
          <Stack>
            <TextInput
              label={t("rooms.roomId")}
              description={t("rooms.roomIdHint")}
              name="room-id"
              autoComplete="off"
              required
              minLength={limits.roomId.min}
              maxLength={limits.roomId.max}
              value={roomId}
              onChange={(event) => setRoomId(inputEventValue(event))}
            />
            <TextInput
              label={t("rooms.roomName")}
              name="room-name"
              autoComplete="off"
              required
              minLength={limits.roomName.min}
              maxLength={limits.roomName.max}
              value={roomName}
              onChange={(event) => setRoomName(inputEventValue(event))}
            />
            <NumberInput
              label={t("rooms.memberLimit")}
              description={t("rooms.memberLimitHint", { max: limits.adminMemberLimit.max })}
              name="member-limit"
              required
              min={limits.adminMemberLimit.min}
              max={limits.adminMemberLimit.max}
              value={memberLimit}
              onChange={(value) => setMemberLimit(typeof value === "number" ? value : limits.memberLimit.max)}
            />
            <PasswordInput
              label={t("rooms.passwordOptional")}
              description={t("rooms.passwordOptionalHint")}
              name="room-password"
              autoComplete="new-password"
              minLength={limits.roomPassword.min}
              maxLength={limits.roomPassword.max}
              value={password}
              onChange={(event) => setPassword(inputEventValue(event))}
            />
            <Switch
              label={t("rooms.isPublic")}
              description={t("rooms.isPublicHint")}
              checked={isPublic}
              onChange={(event) => setIsPublic(inputEventChecked(event))}
            />
            <Select
              label={t("rooms.expires")}
              description={t("rooms.expiresHint")}
              data={expiryOptions}
              value={expiryMode}
              onChange={(value) => setExpiryMode((value as ExpiryMode) ?? "indefinite")}
              allowDeselect={false}
            />
            {expiryMode === "custom" ? (
              <NumberInput
                label={t("rooms.customHours")}
                name="custom-hours"
                required
                min={limits.adminRoomExpiresHours.min}
                max={limits.adminRoomExpiresHours.max}
                value={customHours}
                onChange={(value) => setCustomHours(typeof value === "number" ? value : 48)}
              />
            ) : null}
            <Button type="submit" loading={createMutation.isPending} w="fit-content">
              {t("app.create")}
            </Button>
          </Stack>
        </form>
      </Paper>

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
                <Table.Th>{t("rooms.expiresAt")}</Table.Th>
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
                      <Text size="sm">
                        {room.expiresAt
                          ? new Date(room.expiresAt).toLocaleString()
                          : t("rooms.expiresNever")}
                      </Text>
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
