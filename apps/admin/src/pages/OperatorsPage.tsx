import {
  Button,
  CopyButton,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { limits } from "@coliseum/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { createUser, factoryReset, patchUser, rotateApiKey, fetchUsers } from "../lib/api.ts";
import { inputEventChecked, inputEventValue } from "../lib/input-value.ts";
import { useAdminSession } from "../lib/queries.ts";

export function OperatorsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>({});
  const [rotateOpen, setRotateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createUser({ username, password }),
    onSuccess: async () => {
      setUsername("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const patchMutation = useMutation({
    mutationFn: (input: { id: string; password?: string; disabled?: boolean }) =>
      patchUser(input.id, { password: input.password, disabled: input.disabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const rotateMutation = useMutation({
    mutationFn: rotateApiKey,
    onSuccess: (body) => {
      setNewKey(body.apiKey);
      setRotateOpen(false);
    },
  });
  const resetMutation = useMutation({
    mutationFn: () => factoryReset(resetPhrase),
    onSuccess: async () => {
      setResetOpen(false);
      setResetPhrase("");
      notifications.show({ message: t("operators.resetDone") });
      await queryClient.invalidateQueries();
    },
  });

  const activeCount = (users.data ?? []).filter((user) => !user.disabled).length;
  const requiredPhrase = t("operators.resetPhrase");
  const resetReady = resetPhrase.trim() === requiredPhrase;

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>{t("operators.title")}</Title>
        <Text mt="xs" c="var(--admin-on-variant)">
          {t("operators.lead")}
        </Text>
      </div>
      {users.error ? <ErrorAlert error={users.error} /> : null}
      {createMutation.error ? <ErrorAlert error={createMutation.error} /> : null}
      {patchMutation.error ? <ErrorAlert error={patchMutation.error} /> : null}
      {rotateMutation.error ? <ErrorAlert error={rotateMutation.error} /> : null}
      {resetMutation.error ? <ErrorAlert error={resetMutation.error} /> : null}

      <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
        <Title order={2} size="h3" mb="md">
          {t("operators.newTitle")}
        </Title>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Stack>
            <TextInput
              label={t("operators.username")}
              name="username"
              autoComplete="off"
              required
              minLength={limits.adminUsername.min}
              maxLength={limits.adminUsername.max}
              value={username}
              onChange={(event) => setUsername(inputEventValue(event))}
            />
            <PasswordInput
              label={t("operators.newPassword")}
              description={t("operators.passwordHint")}
              name="new-password"
              autoComplete="new-password"
              required
              minLength={limits.adminPassword.min}
              value={password}
              onChange={(event) => setPassword(inputEventValue(event))}
            />
            <Button type="submit" loading={createMutation.isPending} w="fit-content">
              {t("app.create")}
            </Button>
          </Stack>
        </form>
      </Paper>

      <Table.ScrollContainer minWidth={920}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("operators.username")}</Table.Th>
              <Table.Th>{t("operators.status")}</Table.Th>
              <Table.Th>{t("operators.lastLogin")}</Table.Th>
              <Table.Th>{t("operators.setPassword")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(users.data ?? []).map((user) => {
              const isSelf = session.data?.id === user.id;
              const lastActive = !user.disabled && activeCount <= 1;
              return (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    {user.username}
                    {isSelf ? (
                      <Text span size="sm" c="var(--admin-on-variant)">
                        {" "}
                        ({t("operators.you")})
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      label={user.disabled ? t("operators.disabled") : t("operators.active")}
                      checked={!user.disabled}
                      disabled={lastActive && !user.disabled}
                      onChange={(event) => {
                        const enabled = inputEventChecked(event);
                        if (!enabled && lastActive) {
                          notifications.show({
                            color: "orange",
                            message: t("operators.cannotDisableLast"),
                          });
                          return;
                        }
                        patchMutation.mutate({ id: user.id, disabled: !enabled });
                      }}
                    />
                  </Table.Td>
                  <Table.Td>{user.lastLoginAt ?? t("operators.never")}</Table.Td>
                  <Table.Td miw={280}>
                    <Stack gap="xs">
                      <PasswordInput
                        label={t("operators.setPassword")}
                        description={t("operators.setPasswordHint")}
                        autoComplete="new-password"
                        value={passwordEdits[user.id] ?? ""}
                        onChange={(event) =>
                          setPasswordEdits((prev) => ({ ...prev, [user.id]: inputEventValue(event) }))
                        }
                      />
                      <Button
                        variant="light"
                        w="fit-content"
                        disabled={(passwordEdits[user.id] ?? "").length < limits.adminPassword.min}
                        onClick={() => {
                          const next = passwordEdits[user.id];
                          if (!next) return;
                          patchMutation.mutate(
                            { id: user.id, password: next },
                            {
                              onSuccess: () =>
                                setPasswordEdits((prev) => {
                                  const copy = { ...prev };
                                  delete copy[user.id];
                                  return copy;
                                }),
                            },
                          );
                        }}
                      >
                        {t("app.save")}
                      </Button>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
        <Stack>
          <div>
            <Title order={2} size="h3">
              {t("operators.rotate")}
            </Title>
            <Text size="sm" c="var(--admin-on-variant)">
              {t("operators.rotateHint")}
            </Text>
          </div>
          <Button color="orange" w="fit-content" onClick={() => setRotateOpen(true)}>
            {t("operators.rotate")}
          </Button>
          {newKey ? (
            <Stack gap={6}>
              <Text size="sm">{t("operators.newKeyHint")}</Text>
              <Group>
                <Text ff="Quicksand, sans-serif">{newKey}</Text>
                <CopyButton value={newKey}>
                  {({ copied, copy }) => (
                    <Button variant="light" onClick={copy}>
                      {copied ? t("app.copied") : t("app.copy")}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
        <Stack>
          <div>
            <Title order={2} size="h3">
              {t("operators.resetTitle")}
            </Title>
            <Text size="sm" c="var(--admin-on-variant)">
              {t("operators.resetLead")}
            </Text>
          </div>
          <Button
            color="red"
            w="fit-content"
            onClick={() => {
              setResetPhrase("");
              setResetOpen(true);
            }}
          >
            {t("operators.resetButton")}
          </Button>
        </Stack>
      </Paper>

      <Modal opened={rotateOpen} onClose={() => setRotateOpen(false)} title={t("operators.rotate")}>
        <Stack>
          <Text>{t("operators.rotateConfirm")}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRotateOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button color="orange" loading={rotateMutation.isPending} onClick={() => rotateMutation.mutate()}>
              {t("app.confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setResetPhrase("");
        }}
        title={t("operators.resetConfirmTitle")}
      >
        <Stack>
          <Text>{t("operators.resetLead")}</Text>
          <TextInput
            label={t("operators.resetConfirmHint", { phrase: requiredPhrase })}
            autoComplete="off"
            value={resetPhrase}
            onChange={(event) => setResetPhrase(inputEventValue(event))}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setResetOpen(false);
                setResetPhrase("");
              }}
            >
              {t("app.cancel")}
            </Button>
            <Button color="red" disabled={!resetReady} loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
              {t("app.confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
