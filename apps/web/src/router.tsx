import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { HomeScreen } from "./components/home/home-screen.tsx";
import { NotFoundScreen } from "./components/not-found-screen.tsx";
import { TheaterScreen } from "./components/theater/theater-screen.tsx";
import { useUiStore } from "./stores/ui-store.ts";

function RootLayout() {
  const theme = useUiStore((s) => s.theme);
  return (
    <>
      <Outlet />
      <Toaster theme={theme} duration={5000} closeButton position="bottom-right" />
    </>
  );
}

export const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundScreen kind="page" />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});

function RoomRoute() {
  const { roomId } = useParams({ from: "/rooms/$roomId" });
  return <TheaterScreen roomId={roomId} />;
}

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rooms/$roomId",
  component: RoomRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, roomRoute]);

export function makeRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultNotFoundComponent: () => <NotFoundScreen kind="page" />,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof makeRouter>;
  }
}
