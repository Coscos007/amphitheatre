const KEY = "coliseum.devices";

export type DevicePrefs = {
  audioinput?: string;
  audiooutput?: string;
  videoinput?: string;
  outputVolume: number;
  inputVolume: number;
};

const DEFAULT_PREFS: DevicePrefs = { outputVolume: 1, inputVolume: 1 };

export function readDevicePrefs(): DevicePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<DevicePrefs>;
    const volume = typeof parsed.outputVolume === "number" ? parsed.outputVolume : 1;
    const input = typeof parsed.inputVolume === "number" ? parsed.inputVolume : 1;
    return {
      audioinput: typeof parsed.audioinput === "string" ? parsed.audioinput : undefined,
      audiooutput: typeof parsed.audiooutput === "string" ? parsed.audiooutput : undefined,
      videoinput: typeof parsed.videoinput === "string" ? parsed.videoinput : undefined,
      outputVolume: Math.min(1, Math.max(0, volume)),
      inputVolume: Math.min(1, Math.max(0, input)),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeDevicePrefs(prefs: DevicePrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
