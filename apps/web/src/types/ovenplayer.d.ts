declare module "ovenplayer" {
  export type OvenPlayerSource = {
    type: string;
    file: string;
    label?: string;
  };

  export type OvenPlayerConfig = {
    autoStart?: boolean;
    autoFallback?: boolean;
    controls?: boolean;
    mute?: boolean;
    disableSeekUI?: boolean;
    currentProtocolOnly?: boolean;
    showBigPlayButton?: boolean;
    iOSFakeFullScreen?: boolean;
    expandFullScreenUI?: boolean;
    sources?: OvenPlayerSource[];
    webrtcConfig?: {
      timeoutMaxRetry?: number;
      connectionTimeout?: number;
      playoutDelayHint?: number;
    };
    hlsConfig?: Record<string, unknown>;
  };

  export type OvenPlayerInstance = {
    play: () => void;
    stop: () => void;
    remove: () => void;
    on: (eventName: string, callback: (data?: unknown) => void) => void;
    off: (eventName: string, callback?: (data?: unknown) => void) => void;
    setAutoQuality?: (auto: boolean) => void;
  };

  const OvenPlayer: {
    create: (container: string | HTMLElement, config: OvenPlayerConfig) => OvenPlayerInstance;
  };

  export default OvenPlayer;
}
