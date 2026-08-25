import {
  Anchor,
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDoor, IconLayoutDashboard, IconLogout, IconUsers } from "@tabler/icons-react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { logout } from "../lib/api.ts";
import { LocaleSelect } from "./LocaleSelect.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

export function OperatorShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [opened, { toggle, close }] = useDisclosure();

  async function signOut() {
    await logout().catch(() => undefined);
    await navigate({ to: "/login" });
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="md"
              aria-label={opened ? t("nav.closeMenu") : t("nav.openMenu")}
            />
            <Text fw={800} ff="Hanken Grotesk, sans-serif">
              {t("app.name")}
            </Text>
            <Text size="sm" c="var(--admin-on-variant)" visibleFrom="sm">
              {t("app.operator")}
            </Text>
          </Group>
          <Group gap="xs">
            <LocaleSelect />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        <Stack justify="space-between" h="100%">
          <Stack gap={4}>
            <NavLink
              component={Link}
              to="/"
              label={t("nav.overview")}
              leftSection={<IconLayoutDashboard size={20} />}
              active={pathname === "/"}
              onClick={close}
            />
            <NavLink
              component={Link}
              to="/rooms"
              label={t("nav.rooms")}
              leftSection={<IconDoor size={20} />}
              active={pathname.startsWith("/rooms")}
              onClick={close}
            />
            <NavLink
              component={Link}
              to="/operators"
              label={t("nav.operators")}
              leftSection={<IconUsers size={20} />}
              active={pathname.startsWith("/operators")}
              onClick={close}
            />
          </Stack>
          <Button
            variant="subtle"
            color="gray"
            justify="flex-start"
            leftSection={<IconLogout size={20} />}
            onClick={() => void signOut()}
          >
            {t("nav.signOut")}
          </Button>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main id="main">
        <Anchor href="#main" className="admin-skip-link">
          {t("app.skipToContent")}
        </Anchor>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
