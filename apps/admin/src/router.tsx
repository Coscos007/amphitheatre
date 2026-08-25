import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { OperatorShell } from "./components/OperatorShell.tsx";
import { fetchSessionOrNull, sessionQueryKey } from "./lib/queries.ts";
import { LoginPage } from "./pages/LoginPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { OperatorsPage } from "./pages/OperatorsPage.tsx";
import { OverviewPage } from "./pages/OverviewPage.tsx";
import { RoomDetailPage } from "./pages/RoomDetailPage.tsx";
import { RoomsPage } from "./pages/RoomsPage.tsx";

async function requireSession(queryClient: QueryClient) {
  const session = await queryClient.ensureQueryData({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionOrNull,
  });
  if (!session) throw redirect({ to: "/login" });
  return session;
}

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: sessionQueryKey,
      queryFn: fetchSessionOrNull,
    });
    if (session) throw redirect({ to: "/" });
  },
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: OperatorShell,
  beforeLoad: async ({ context }) => {
    await requireSession(context.queryClient);
  },
});

const indexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: OverviewPage,
});

const roomsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/rooms",
  component: RoomsPage,
});

const roomDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/rooms/$roomId",
  component: RoomDetailPage,
});

const operatorsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/operators",
  component: OperatorsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  shellRoute.addChildren([indexRoute, roomsRoute, roomDetailRoute, operatorsRoute]),
]);

export function makeRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultNotFoundComponent: NotFoundPage,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof makeRouter>;
  }
}
