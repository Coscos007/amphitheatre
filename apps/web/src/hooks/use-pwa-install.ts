import { useCallback, useEffect, useState } from "react";
import { isIosDevice, isStandaloneDisplay } from "../lib/pwa.ts";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallHelp = "ios" | "browser" | null;

const BANNER_DISMISS_KEY = "coliseum.pwaBannerDismissed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedNow = typeof window !== "undefined" && isStandaloneDisplay();
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installedNow = true;
    emit();
  });
}

export function usePwaInstall() {
  const [, bump] = useState(0);
  const [help, setHelp] = useState<InstallHelp>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(BANNER_DISMISS_KEY) === "1";
  });

  useEffect(() => {
    const onChange = () => bump((value) => value + 1);
    subscribers.add(onChange);
    const standalone = window.matchMedia("(display-mode: standalone)");
    const overlay = window.matchMedia("(display-mode: window-controls-overlay)");
    const syncInstalled = () => {
      installedNow = isStandaloneDisplay();
      emit();
    };
    standalone.addEventListener("change", syncInstalled);
    overlay.addEventListener("change", syncInstalled);
    return () => {
      subscribers.delete(onChange);
      standalone.removeEventListener("change", syncInstalled);
      overlay.removeEventListener("change", syncInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") deferredPrompt = null;
      emit();
      return;
    }
    setHelp(isIosDevice() ? "ios" : "browser");
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_DISMISS_KEY, "1");
    setBannerDismissed(true);
  }, []);

  return {
    installed: installedNow,
    canNativePrompt: deferredPrompt !== null,
    help,
    closeHelp: () => setHelp(null),
    promptInstall,
    showBanner: !installedNow && !bannerDismissed,
    dismissBanner,
  };
}
