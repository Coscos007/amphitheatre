import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { STREAM_PROVIDERS, type StreamProvider } from "@coliseum/shared";
import { updateRoomStream } from "../../lib/api.ts";
import type { OmeInfo, RoomBroadcast } from "../../shared-types.ts";
import { useRoomStore } from "../../stores/room-store.ts";
import { Button } from "../ui/button.tsx";
import { Field } from "../ui/field.tsx";
import { Input } from "../ui/input.tsx";

type BroadcastSettingsPanelProps = {
  roomId: string;
  broadcast: RoomBroadcast;
  ingest?: OmeInfo["ingest"];
  active: boolean;
};

const providerKey: Record<StreamProvider, string> = {
  ome: "settings.providerOme",
  twitch: "settings.providerTwitch",
  youtube: "settings.providerYoutube",
  kick: "settings.providerKick",
  custom: "settings.providerCustom",
};

export function BroadcastSettingsPanel({ roomId, broadcast, ingest, active }: BroadcastSettingsPanelProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(broadcast.enabled);
  const [provider, setProvider] = useState<StreamProvider>(
    broadcast.provider === "none" ? "ome" : broadcast.provider,
  );
  const [embed, setEmbed] = useState(broadcast.embed ?? "");
  const [busy, setBusy] = useState(false);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setOme = useRoomStore((s) => s.setOme);

  useEffect(() => {
    if (!active) return;
    setEnabled(broadcast.enabled);
    setProvider(broadcast.provider === "none" ? "ome" : broadcast.provider);
    setEmbed(broadcast.embed ?? "");
  }, [active]);

  const save = async (rotateKey = false) => {
    setBusy(true);
    try {
      const result = await updateRoomStream(roomId, {
        enabled,
        provider: enabled ? provider : undefined,
        embed: enabled && provider !== "ome" ? embed : null,
        rotateKey,
      });
      setRoom(result.room);
      if (result.ome) setOme(result.ome);
      toast.success(t("toast.broadcastSaved"));
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("toast.copied"));
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--accent)]"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span>
          <span className="block font-medium">{t("settings.broadcastEnable")}</span>
          <span className="text-ink-muted">{t("settings.broadcastEnableHint")}</span>
        </span>
      </label>
      {enabled ? (
        <>
          <fieldset>
            <legend className="label-caps mb-2 text-ink-muted">{t("settings.providerLegend")}</legend>
            <div className="grid gap-2">
              {STREAM_PROVIDERS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name="stream-provider"
                    className="accent-[var(--accent)]"
                    checked={provider === item}
                    onChange={() => setProvider(item)}
                  />
                  {t(providerKey[item])}
                </label>
              ))}
            </div>
          </fieldset>
          {provider !== "ome" ? (
            <Field
              id="broadcast-embed"
              label={t("settings.embedLabel")}
              hint={t(`settings.embedHint.${provider}`)}
            >
              <Input
                id="broadcast-embed"
                value={embed}
                onChange={(event) => setEmbed(event.target.value)}
                placeholder={t(`settings.embedPlaceholder.${provider}`)}
              />
            </Field>
          ) : ingest ? (
            <div className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-surface-sunken p-3">
              <Field id="rtmp-url" label={t("settings.rtmpUrl")} hint={t("theater.ingestHint")}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="rtmp-url" readOnly value={ingest.rtmpUrl} className="min-w-0" />
                  <Button variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={() => void copy(ingest.rtmpUrl)}>
                    {t("app.copy")}
                  </Button>
                </div>
              </Field>
              <Field id="stream-key" label={t("settings.streamKey")} hint={t("settings.streamKeyHint")}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="stream-key" readOnly value={ingest.streamKey} className="min-w-0" />
                  <Button variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={() => void copy(ingest.streamKey)}>
                    {t("app.copy")}
                  </Button>
                </div>
              </Field>
              <Button variant="secondary" onClick={() => void save(true)} loading={busy}>
                {t("settings.rotateKey")}
              </Button>
            </div>
          ) : (
            <p>{t("settings.omeSaveFirst")}</p>
          )}
        </>
      ) : null}
      <div className="flex justify-stretch sm:justify-end">
        <Button className="w-full sm:w-auto" onClick={() => void save(false)} loading={busy}>
          {t("settings.saveBroadcast")}
        </Button>
      </div>
    </div>
  );
}
