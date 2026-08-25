import { SegmentedControl, Stack, Text } from "@mantine/core";
import { ADMIN_TIME_RANGES, type AdminTimeRange } from "@coliseum/shared";
import { useTranslation } from "react-i18next";

export function RangeControl({
  value,
  onChange,
}: {
  value: AdminTimeRange;
  onChange: (range: AdminTimeRange) => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack gap={6}>
      <Text size="sm" c="var(--admin-on-variant)">
        {t("range.label")}
      </Text>
      <SegmentedControl
        aria-label={t("range.label")}
        value={value}
        onChange={(next) => onChange(next as AdminTimeRange)}
        data={ADMIN_TIME_RANGES.map((range) => ({ value: range, label: t(`range.${range}`) }))}
      />
    </Stack>
  );
}
