import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { formatRemaining } from "../../lib/format.ts";
import { gateJoinSchema, type GateJoinValues } from "../../lib/schemas.ts";
import { useCountdown } from "../../hooks/use-media.ts";
import { useSessionStore } from "../../stores/session-store.ts";
import { useUiStore } from "../../stores/ui-store.ts";
import { Button } from "../ui/button.tsx";
import { Field } from "../ui/field.tsx";
import { Input } from "../ui/input.tsx";
import { SiteHeader, SkipLink } from "../chrome/site-header.tsx";

type JoinGateProps = {
  roomName?: string;
  hasPassword: boolean;
  lockoutUntil: number | null;
  error?: string;
  onJoin: (values: { displayName: string; password?: string }) => Promise<void>;
};

export function JoinGate({
  roomName,
  hasPassword,
  lockoutUntil,
  error,
  onJoin,
}: JoinGateProps) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const draft = useSessionStore((s) => s.displayNameDraft);
  const remaining = useCountdown(lockoutUntil);
  const locked = remaining > 0;
  const form = useForm<GateJoinValues>({
    resolver: zodResolver(gateJoinSchema),
    defaultValues: { displayName: draft, password: "" },
  });

  return (
    <div className="cockpit-shell min-h-dvh">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-dvh max-w-md items-center px-4 pt-24 pb-10">
        <div className="glass-panel w-full p-8">
        <h1 className="font-display text-3xl font-bold text-ink">
          {t("join.title", { name: roomName ?? t("join.untitled") })}
        </h1>
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onJoin({
              displayName: values.displayName,
              password: values.password.trim() || undefined,
            });
          })}
        >
          <Field
            id="gate-name"
            label={t("home.displayName")}
            error={
              form.formState.errors.displayName?.message
                ? t(form.formState.errors.displayName.message)
                : undefined
            }
          >
            <Input id="gate-name" autoComplete="nickname" {...form.register("displayName")} />
          </Field>
          {hasPassword ? (
            <Field id="gate-password" label={t("join.password")}>
              <Input
                id="gate-password"
                type="password"
                autoComplete="current-password"
                disabled={locked}
                {...form.register("password")}
              />
            </Field>
          ) : null}
          {locked ? (
            <p className="text-sm text-warning" role="status">
              {t("join.lockout", { time: formatRemaining(remaining, locale) })}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="touch" disabled={locked} loading={form.formState.isSubmitting}>
            {t("join.action")}
          </Button>
        </form>
        </div>
      </main>
    </div>
  );
}
