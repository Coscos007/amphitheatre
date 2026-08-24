import { IconPin, IconPinnedOff, IconRefresh, IconScreenShare, IconVideo } from "@tabler/icons-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";

type StageTileChromeProps = {
  title: string;
  source?: "camera" | "screen" | "broadcast";
  pinned: boolean;
  onTogglePin: () => void;
  onReload?: () => void;
  children: ReactNode;
  className?: string;
};

const HIDE_MS = 3000;

const chromeBtnClass =
  "pointer-events-auto inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70";

export function StageTileChrome({
  title,
  source = "broadcast",
  pinned,
  onTogglePin,
  onReload,
  children,
  className,
}: StageTileChromeProps) {
  const { t } = useTranslation();
  const [chrome, setChrome] = useState(false);
  const hideRef = useRef<number>(0);

  const show = () => {
    window.clearTimeout(hideRef.current);
    setChrome(true);
  };

  const scheduleHide = () => {
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => setChrome(false), HIDE_MS);
  };

  useEffect(() => {
    return () => window.clearTimeout(hideRef.current);
  }, []);

  return (
    <article
      className={cn("relative min-h-0 overflow-hidden rounded-[var(--radius-panel)] bg-black", className)}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocusCapture={show}
      onBlurCapture={scheduleHide}
    >
      <div className="absolute inset-0">{children}</div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-2 transition-opacity duration-200",
          chrome ? "opacity-100" : "opacity-0",
        )}
      >
        <p className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-white">
          {source === "screen" ? (
            <IconScreenShare className="size-3.5 shrink-0" aria-hidden="true" />
          ) : source === "camera" ? (
            <IconVideo className="size-3.5 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="truncate">{title}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {onReload ? (
            <button
              type="button"
              tabIndex={chrome ? 0 : -1}
              className={chromeBtnClass}
              aria-label={t("theater.reloadStream")}
              onClick={onReload}
            >
              <IconRefresh className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={chrome ? 0 : -1}
            className={chromeBtnClass}
            aria-pressed={pinned}
            aria-label={pinned ? t("theater.unpin") : t("theater.pin")}
            onClick={onTogglePin}
          >
            {pinned ? (
              <IconPinnedOff className="size-4" aria-hidden="true" />
            ) : (
              <IconPin className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
