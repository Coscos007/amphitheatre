import { limits } from "@coliseum/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconMessage, IconSend } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCountdown } from "../../hooks/use-media.ts";
import { formatClock, initials } from "../../lib/format.ts";
import { chatSchema } from "../../lib/schemas.ts";
import { cn } from "../../lib/cn.ts";
import type { ChatMessage } from "../../shared-types.ts";
import { useUiStore } from "../../stores/ui-store.ts";
import { Button } from "../ui/button.tsx";

type ChatPanelProps = {
  messages: ChatMessage[];
  selfId?: string;
  roomName?: string;
  mutedUntil?: number | null;
  onSend: (text: string) => boolean;
};

export function ChatPanel({ messages, selfId, roomName, mutedUntil, onSend }: ChatPanelProps) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const bottomRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const form = useForm<{ text: string }>({
    resolver: zodResolver(chatSchema),
    defaultValues: { text: "" },
  });
  const text = form.watch("text");
  const remaining = useCountdown(mutedUntil ?? null);
  const muted = remaining > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const { ref: registerRef, ...textField } = form.register("text");

  const submit = form.handleSubmit((values) => {
    if (muted) return;
    const ok = onSend(values.text);
    if (ok) form.reset({ text: "" });
  });

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={t("a11y.chatRegion")}>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-ink-muted">
            <span className="flex size-16 items-center justify-center rounded-full bg-surface-sunken">
              <IconMessage className="size-8 text-ink-subtle" aria-hidden="true" />
            </span>
            <p className="font-display font-medium text-ink">{t("theater.chatEmptyTitle")}</p>
            <p className="max-w-[220px] text-sm">{t("theater.chatEmptyBody")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => {
              const mine = message.userId === selfId;
              return (
                <li key={message.id} className={cn("flex w-full min-w-0 flex-col gap-1", mine ? "items-end" : "items-start")}>
                  <div className={cn("mb-1 flex items-center gap-2", mine && "flex-row-reverse")}>
                    {mine ? null : (
                      <span className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-sunken text-[10px] font-bold">
                        {initials(message.displayName)}
                      </span>
                    )}
                    <span className={cn("text-xs font-medium", mine ? "text-accent" : "text-ink-muted")}>
                      {mine ? t("app.you") : message.displayName}
                    </span>
                    <time className="text-[10px] text-ink-subtle" dateTime={message.createdAt}>
                      {formatClock(message.createdAt, locale)}
                    </time>
                  </div>
                  <p
                    className={cn(
                      "max-w-[85%] min-w-0 overflow-hidden rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap text-ink [overflow-wrap:anywhere]",
                      mine
                        ? "rounded-tr-none border border-accent/30 bg-accent-soft"
                        : "rounded-tl-none border border-border/60 bg-surface-sunken",
                    )}
                  >
                    {message.text}
                  </p>
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
      <form className="border-t border-border/70 p-4" onSubmit={submit}>
        <div className="flex items-end gap-2 rounded-[var(--radius-control)] border border-border bg-surface-sunken px-2 py-1.5 focus-within:border-accent">
          <label htmlFor="chat-message" className="sr-only">
            {t("theater.chatLabel")}
          </label>
          <textarea
            id="chat-message"
            rows={1}
            maxLength={limits.chatText.max}
            disabled={muted}
            placeholder={
              muted
                ? t("theater.chatMuted")
                : roomName
                  ? t("theater.chatPlaceholderNamed", { name: roomName })
                  : t("theater.chatPlaceholder")
            }
            className="max-h-40 min-h-9 min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none disabled:opacity-60"
            aria-invalid={Boolean(form.formState.errors.text) || undefined}
            {...textField}
            ref={(el) => {
              registerRef(el);
              areaRef.current = el;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="mb-0.5 size-8 shrink-0"
            disabled={muted}
            aria-label={t("theater.chatSend")}
          >
            <IconSend className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-ink-subtle">
          <span>
            {(text ?? "").length}/{limits.chatText.max}
          </span>
          {form.formState.errors.text?.message ? (
            <p className="text-danger" role="alert">
              {t(form.formState.errors.text.message)}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
