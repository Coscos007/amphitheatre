import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/i18n.ts";
import { registerServiceWorker } from "./lib/pwa.ts";
import { makeRouter } from "./router.tsx";
import { useUiStore } from "./stores/ui-store.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = makeRouter(queryClient);

useUiStore.getState().setTheme(useUiStore.getState().theme);
registerServiceWorker();

const root = document.getElementById("root");
if (!root) throw new Error("Root element missing");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
