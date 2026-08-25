import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Stack gap="md" py="xl">
      <Title order={1}>{t("app.notFound")}</Title>
      <Text c="var(--admin-on-variant)">{t("app.notFoundHint")}</Text>
      <Button component={Link} to="/" w="fit-content">
        {t("app.backOverview")}
      </Button>
    </Stack>
  );
}
