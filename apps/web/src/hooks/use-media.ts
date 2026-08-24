import { useEffect, useState } from "react";

export function useTheaterLayout(): "mobile" | "desktop" {
  const [layout, setLayout] = useState<"mobile" | "desktop">(() => {
    if (typeof window === "undefined") return "desktop";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    return coarse || narrow ? "mobile" : "desktop";
  });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setLayout(coarse.matches || narrow.matches ? "mobile" : "desktop");
    };
    update();
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  return layout;
}

export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const timer = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return show;
}

export function useCountdown(until: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    until ? Math.max(0, until - Date.now()) : 0,
  );

  useEffect(() => {
    if (!until) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, until - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  return remaining;
}

export function canShareScreen(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);
}
