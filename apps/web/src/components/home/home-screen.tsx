import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { IconArrowRight } from "@tabler/icons-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  createRoom,
  createSession,
  joinRoom,
  parseRoomCode,
  ApiError,
  isLockoutError,
} from "../../lib/api.ts";
import {
  createRoomSchema,
  joinRoomSchema,
  type CreateRoomValues,
  type JoinRoomValues,
} from "../../lib/schemas.ts";
import { useSessionStore } from "../../stores/session-store.ts";
import { useRoomStore } from "../../stores/room-store.ts";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { cn } from "../../lib/cn.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { SkipLink } from "../chrome/site-header.tsx";
import { HomeHeader } from "./home-header.tsx";
import { HomeHero } from "./home-hero.tsx";
import { HomeMoodRail } from "./home-mood-rail.tsx";
import { HomeActionTabs, HomePanel } from "./home-panel.tsx";
import { InfiniteGrid3D } from "./infinite-grid-3d.tsx";
import { PwaInstallBanner } from "../chrome/pwa-install.tsx";

const compactField =
  "h-auto min-h-11 rounded-lg bg-surface-raised px-3 py-2.5 text-sm";

export function HomeScreen() {
  const { t } = useTranslation();
  const compactChrome = useCompactChrome();
  const navigate = useNavigate();
  const displayNameDraft = useSessionStore((s) => s.displayNameDraft);
  const setDisplayNameDraft = useSessionStore((s) => s.setDisplayNameDraft);
  const setSession = useSessionStore((s) => s.setSession);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setLockout = useRoomStore((s) => s.setLockout);

  const createForm = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      displayName: displayNameDraft,
      name: "",
      password: "",
      memberLimit: 20,
    },
  });

  const joinForm = useForm<JoinRoomValues>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      displayName: displayNameDraft,
      roomId: "",
      password: "",
    },
  });

  const syncName = (value: string) => {
    setDisplayNameDraft(value);
    createForm.setValue("displayName", value, { shouldValidate: true });
    joinForm.setValue("displayName", value, { shouldValidate: true });
  };

  useEffect(() => {
    createForm.setValue("displayName", displayNameDraft);
    joinForm.setValue("displayName", displayNameDraft);
  }, [displayNameDraft, createForm, joinForm]);

  const ensureUser = async (displayName: string) => {
    const session = await createSession(displayName);
    setSession(session, session.token);
    return session;
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      await ensureUser(displayNameDraft.trim() || values.displayName);
      const room = await createRoom({
        name: values.name,
        password: values.password.trim() || undefined,
        memberLimit: values.memberLimit,
      });
      setRoom(room);
      toast.success(t("toast.roomCreated"));
      await navigate({ to: "/rooms/$roomId", params: { roomId: room.id } });
    } catch {
      toast.error(t("toast.createFailed"));
    }
  });

  const onJoin = joinForm.handleSubmit(async (values) => {
    const code = parseRoomCode(values.roomId);
    try {
      await ensureUser(displayNameDraft.trim() || values.displayName);
      const result = await joinRoom(code, values.password.trim() || undefined);
      setRoom(result.room);
      toast.success(t("toast.joined"));
      await navigate({
        to: "/rooms/$roomId",
        params: { roomId: result.room.id },
      });
    } catch (error) {
      if (isLockoutError(error)) {
        setLockout(Date.now() + (error.remainingMs ?? 5 * 60 * 1000));
      }
      const codeName = error instanceof ApiError ? error.code : "";
      if (
        codeName === "invalid_password" ||
        codeName === "cannot_join" ||
        codeName === "unauthorized"
      ) {
        toast.error(t("join.invalidPassword"));
        return;
      }
      if (codeName === "room_full" || codeName === "conflict") {
        toast.error(t("join.full"));
        return;
      }
      if (codeName === "not_found") {
        toast.error(t("join.notFound"));
        return;
      }
      if (codeName === "banned") {
        toast.error(t("join.banned"));
        return;
      }
      toast.error(t("toast.joinFailed"));
    }
  });

  const createNameError = createForm.formState.errors.displayName?.message
    ? t(createForm.formState.errors.displayName.message)
    : undefined;
  const roomNameError = createForm.formState.errors.name?.message
    ? t(createForm.formState.errors.name.message)
    : undefined;
  const memberLimitError = createForm.formState.errors.memberLimit?.message
    ? t(createForm.formState.errors.memberLimit.message)
    : undefined;
  const roomIdError = joinForm.formState.errors.roomId?.message
    ? t(joinForm.formState.errors.roomId.message)
    : undefined;

  return (
    <div className="home-shell relative flex min-h-dvh flex-col overflow-x-hidden xl:h-dvh xl:overflow-hidden">
      <InfiniteGrid3D
        cellWidth={80}
        cellHeight={35}
        lineWidth={2}
        perspective={300}
        duration={1}
      />
      <SkipLink />
      <HomeHeader displayName={displayNameDraft} />
      <PwaInstallBanner />
      <main
        id="main"
        className={cn(
          "relative z-10 flex min-h-dvh flex-1 flex-col items-center justify-center overflow-x-hidden px-4 pt-20 sm:px-8 sm:pt-24",
          compactChrome ? "pb-28" : "pb-10 sm:pb-12",
        )}
      >
        <div className="relative z-10 flex h-full w-full max-w-[1400px] flex-col gap-12 xl:flex-row">
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center xl:items-start xl:gap-12 xl:text-left">
            <HomeHero />
            <HomeMoodRail />
          </div>

          <HomePanel>
            <div className="px-4 pt-4 sm:px-8 sm:pt-8">
              <div className="rounded-xl border border-border/50 bg-surface-sunken/30 p-4">
                <label
                  htmlFor="display-name"
                  className="mb-2 block font-label text-[10px] font-semibold tracking-[0.08em] text-ink-muted uppercase"
                >
                  {t("home.displayName")}
                </label>
                <Input
                  id="display-name"
                  autoComplete="nickname"
                  placeholder={t("home.displayNamePlaceholder")}
                  value={displayNameDraft}
                  onChange={(event) => syncName(event.target.value)}
                  error={Boolean(createForm.formState.errors.displayName)}
                  className="h-auto rounded-lg bg-surface-page px-3 py-2 text-sm"
                />
                {createNameError ? (
                  <p className="mt-1.5 text-xs text-danger" role="alert">
                    {createNameError}
                  </p>
                ) : null}
              </div>
            </div>

            <HomeActionTabs
              join={
                <form className="space-y-4" onSubmit={onJoin}>
                  <div>
                    <label htmlFor="room-id" className="sr-only">
                      {t("home.roomId")}
                    </label>
                    <Input
                      id="room-id"
                      placeholder={t("home.roomIdPlaceholder")}
                      autoComplete="off"
                      className={`${compactField} tracking-wide uppercase`}
                      error={Boolean(joinForm.formState.errors.roomId)}
                      {...joinForm.register("roomId")}
                    />
                    {roomIdError ? (
                      <p className="mt-1.5 text-xs text-danger" role="alert">
                        {roomIdError}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="join-password" className="sr-only">
                      {t("home.joinPassword")}
                    </label>
                    <Input
                      id="join-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t("home.joinPasswordPlaceholder")}
                      className={compactField}
                      {...joinForm.register("password")}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="mt-2 h-auto min-h-11 w-full rounded-lg border border-border bg-surface-bright py-3 text-xs text-ink hover:border-accent hover:bg-surface-sunken hover:text-accent"
                    loading={joinForm.formState.isSubmitting}
                  >
                    <IconArrowRight className="size-[14px]" aria-hidden="true" />
                    {t("home.joinAction")}
                  </Button>
                </form>
              }
              create={
                <form className="space-y-4" onSubmit={onCreate}>
                  <div>
                    <label htmlFor="room-name" className="sr-only">
                      {t("home.roomName")}
                    </label>
                    <Input
                      id="room-name"
                      placeholder={t("home.roomNamePlaceholder")}
                      className={compactField}
                      error={Boolean(createForm.formState.errors.name)}
                      {...createForm.register("name")}
                    />
                    {roomNameError ? (
                      <p className="mt-1.5 text-xs text-danger" role="alert">
                        {roomNameError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="room-password" className="sr-only">
                        {t("home.password")}
                      </label>
                      <Input
                        id="room-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder={t("home.passwordPlaceholder")}
                        className={compactField}
                        {...createForm.register("password")}
                      />
                    </div>
                    <div className="w-24 shrink-0">
                      <label htmlFor="member-limit" className="sr-only">
                        {t("home.memberLimit")}
                      </label>
                      <Input
                        id="member-limit"
                        type="number"
                        min={2}
                        max={50}
                        placeholder={t("home.memberLimitPlaceholder")}
                        className={`${compactField} text-center`}
                        error={Boolean(createForm.formState.errors.memberLimit)}
                        {...createForm.register("memberLimit", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                  {memberLimitError ? (
                    <p className="text-xs text-danger" role="alert">
                      {memberLimitError}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    className="mt-2 h-auto min-h-11 w-full rounded-lg py-3 text-xs"
                    loading={createForm.formState.isSubmitting}
                  >
                    {t("home.createAction")}
                  </Button>
                </form>
              }
            />
          </HomePanel>
        </div>
      </main>
    </div>
  );
}
