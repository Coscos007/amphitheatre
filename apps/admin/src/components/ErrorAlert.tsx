import { Alert, List, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { describeApiError } from "../lib/errors.ts";

export function ErrorAlert({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const copy = describeApiError(error, t);
  return (
    <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title={copy.what}>
      <List spacing={4} size="sm">
        <List.Item>
          <Text span fw={600}>
            {t("errors.why")}:{" "}
          </Text>
          {copy.why}
        </List.Item>
        <List.Item>
          <Text span fw={600}>
            {t("errors.how")}:{" "}
          </Text>
          {copy.how}
        </List.Item>
      </List>
    </Alert>
  );
}
