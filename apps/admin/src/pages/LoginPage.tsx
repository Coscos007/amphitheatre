import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { LocaleSelect } from "../components/LocaleSelect.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { login } from "../lib/api.ts";
import { inputEventValue } from "../lib/input-value.ts";
import { sessionQueryKey } from "../lib/queries.ts";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const mutation = useMutation({
    mutationFn: () => login({ username, password, apiKey }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await navigate({ to: "/" });
    },
  });

  return (
    <Container size={480} py={48}>
      <Anchor href="#main" className="admin-skip-link">
        {t("app.skipToContent")}
      </Anchor>
      <Group justify="flex-end" mb="lg">
        <LocaleSelect />
        <ThemeToggle />
      </Group>
      <Paper id="main" p="xl" radius="lg" withBorder bg="var(--admin-surface-raised)">
        <Stack gap="lg">
          <div>
            <Title order={1}>{t("login.title")}</Title>
            <Text mt="sm" c="var(--admin-on-variant)">
              {t("login.lead")}
            </Text>
          </div>
          {mutation.error ? <ErrorAlert error={mutation.error} /> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <Stack>
              <TextInput
                label={t("login.username")}
                description={t("login.usernameHint")}
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(inputEventValue(event))}
              />
              <PasswordInput
                label={t("login.password")}
                description={t("login.passwordHint")}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(inputEventValue(event))}
              />
              <PasswordInput
                label={t("login.apiKey")}
                description={t("login.apiKeyHint")}
                name="api-key"
                autoComplete="off"
                required
                value={apiKey}
                onChange={(event) => setApiKey(inputEventValue(event))}
              />
              <Button type="submit" loading={mutation.isPending} size="md">
                {mutation.isPending ? t("login.submitting") : t("login.submit")}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
