import { Badge } from "@mantine/core";

export function HealthBadge({ ok, okLabel, failLabel }: { ok: boolean; okLabel: string; failLabel: string }) {
  return (
    <Badge
      size="lg"
      variant="light"
      color={ok ? "pulse" : "red"}
      tt="none"
      leftSection={
        <span aria-hidden="true" style={{ fontWeight: 700 }}>
          {ok ? "OK" : "!"}
        </span>
      }
    >
      {ok ? okLabel : failLabel}
    </Badge>
  );
}
