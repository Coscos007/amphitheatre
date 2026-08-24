import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";
import { Button } from "./button.tsx";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  bodyClassName?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  const fill = size === "xl";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "arena-dialog",
        size === "lg" && "arena-dialog-lg",
        size === "xl" && "arena-dialog-xl",
      )}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="font-sans text-base font-semibold leading-6 text-ink">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("app.close")}>
          <IconX aria-hidden="true" />
        </Button>
      </div>
      <div
        className={cn(
          "text-sm text-ink-muted",
          fill
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "max-h-[min(28rem,60dvh)] overflow-y-auto px-5 py-4",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer ? (
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
      ) : null}
    </dialog>
  );
}
