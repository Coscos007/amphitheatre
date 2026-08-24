import { IconWifi, IconWifi1, IconWifi2, IconWifiOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { ConnectionQuality } from "@coliseum/shared";

const icons = {
  excellent: IconWifi,
  good: IconWifi2,
  poor: IconWifi1,
  lost: IconWifiOff,
  unknown: IconWifi2,
} as const;

const keys = {
  excellent: "indicator.qualityExcellent",
  good: "indicator.qualityGood",
  poor: "indicator.qualityPoor",
  lost: "indicator.qualityLost",
  unknown: "indicator.qualityUnknown",
} as const;

export function ConnectionIndicator({
  quality,
}: {
  quality: ConnectionQuality | "unknown";
}) {
  const { t } = useTranslation();
  const Icon = icons[quality];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{t(keys[quality])}</span>
    </span>
  );
}
