import { CHAT_FLOOD_BAN_SECONDS } from "@coliseum/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updateRoomChat } from "../../lib/api.ts";
import { Button } from "../ui/button.tsx";

type ChatSettingsPanelProps = {
  roomId: string;
  floodBanSec: number;
  active: boolean;
  onSaved: (floodBanSec: number) => void;
};

export function ChatSettingsPanel({ roomId, floodBanSec, active, onSaved }: ChatSettingsPanelProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState<60 | 120>(floodBanSec === 120 ? 120 : 60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (active) setValue(floodBanSec === 120 ? 120 : 60);
  }, [active, floodBanSec]);

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateRoomChat(roomId, value);
      onSaved(result.room.chatFloodBanSec);
      toast.success(t("toast.chatSettingsSaved"));
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <h3 className="label-caps text-ink">{t("settings.chatFloodTitle")}</h3>
        <p className="text-sm text-ink-muted">{t("settings.chatFloodHint")}</p>
      </div>
      <div className="flex flex-col gap-1" role="radiogroup" aria-label={t("settings.chatFloodTitle")}>
        {CHAT_FLOOD_BAN_SECONDS.map((sec) => (
          <label key={sec} className="flex min-h-9 items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="chat-flood-ban"
              checked={value === sec}
              onChange={() => setValue(sec)}
              className="accent-[var(--accent)]"
            />
            {t(sec === 60 ? "settings.chatFlood1m" : "settings.chatFlood2m")}
          </label>
        ))}
      </div>
      <div className="flex justify-stretch sm:justify-end">
        <Button type="button" className="w-full sm:w-auto" disabled={busy} onClick={() => void save()}>
          {t("settings.saveChat")}
        </Button>
      </div>
    </section>
  );
}
