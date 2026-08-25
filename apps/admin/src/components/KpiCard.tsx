import { ActionIcon, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";

export function KpiCard({
  label,
  value,
  hint,
  tooltip,
  helpLabel,
}: {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
  helpLabel?: string;
}) {
  return (
    <Paper p="md" radius="lg" withBorder bg="var(--admin-surface-raised)">
      <Stack gap={4}>
        <Group gap={6} wrap="nowrap" justify="space-between" align="flex-start">
          <Text size="xs" tt="uppercase" ff="Quicksand, sans-serif" fw={600} lts="0.08em" c="var(--admin-on-variant)">
            {label}
          </Text>
          {tooltip ? (
            <Tooltip
              label={tooltip}
              multiline
              maw={280}
              withArrow
              events={{ hover: true, focus: true, touch: true }}
            >
              <ActionIcon variant="subtle" size="sm" color="gray" aria-label={helpLabel ?? tooltip}>
                <IconHelp size={16} stroke={1.75} />
              </ActionIcon>
            </Tooltip>
          ) : null}
        </Group>
        <Text fz={28} fw={700} ff="Hanken Grotesk, sans-serif" lh={1.15} c="var(--mantine-color-text)">
          {value}
        </Text>
        {hint ? (
          <Text size="sm" c="var(--admin-on-variant)">
            {hint}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}
