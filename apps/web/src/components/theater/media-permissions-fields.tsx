import { IconMicrophone, IconVideo } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  mediaFailureToastKey,
  queryMediaPermission,
  requestMediaPermission,
  type MediaPermissionKind,
  type MediaPermissionState,
} from "../../lib/media-permissions.ts";
import { Button } from "../ui/button.tsx";

function stateLabelKey(state: MediaPermissionState): string {
  switch (state) {
    case "granted":
      return "settings.mediaStateGranted";
    case "denied":
      return "settings.mediaStateDenied";
    case "prompt":
      return "settings.mediaStatePrompt";
    default:
      return "settings.mediaStateUnknown";
  }
}

export function MediaPermissionsFields() {
  const { t } = useTranslation();
  const [mic, setMic] = useState<MediaPermissionState>("unknown");
  const [cam, setCam] = useState<MediaPermissionState>("unknown");
  const [busy, setBusy] = useState<MediaPermissionKind | null>(null);

  const refresh = async () => {
    const [nextMic, nextCam] = await Promise.all([
      queryMediaPermission("microphone"),
      queryMediaPermission("camera"),
    ]);
    setMic(nextMic);
    setCam(nextCam);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const request = async (kind: MediaPermissionKind) => {
    setBusy(kind);
    const result = await requestMediaPermission(kind);
    setBusy(null);
    if (result === "granted") {
      toast.success(t("settings.mediaGranted"));
    } else {
      toast.error(t(mediaFailureToastKey(result)));
    }
    await refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="label-caps text-ink-muted">{t("settings.mediaTitle")}</p>
        <p className="mt-2 text-sm text-ink-muted">{t("settings.mediaBody")}</p>
        <p className="mt-2 text-sm text-ink-muted">{t("settings.mediaSafari")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">
            {t("settings.audioInput")}
            <span className="mt-0.5 block text-xs text-ink-subtle">{t(stateLabelKey(mic))}</span>
          </p>
          <Button
            type="button"
            variant={mic === "granted" ? "secondary" : "primary"}
            size="sm"
            className="shrink-0"
            loading={busy === "microphone"}
            onClick={() => void request("microphone")}
          >
            <IconMicrophone aria-hidden="true" />
            {t("settings.allowMicrophone")}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">
            {t("settings.videoInput")}
            <span className="mt-0.5 block text-xs text-ink-subtle">{t(stateLabelKey(cam))}</span>
          </p>
          <Button
            type="button"
            variant={cam === "granted" ? "secondary" : "primary"}
            size="sm"
            className="shrink-0"
            loading={busy === "camera"}
            onClick={() => void request("camera")}
          >
            <IconVideo aria-hidden="true" />
            {t("settings.allowCamera")}
          </Button>
        </div>
      </div>
    </div>
  );
}
