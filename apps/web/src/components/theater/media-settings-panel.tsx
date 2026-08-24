import { IconHeadphones, IconMicrophone, IconVideo } from "@tabler/icons-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { MediaDeviceKindName } from "../../hooks/use-livekit.ts";
import { readDevicePrefs, writeDevicePrefs } from "../../lib/device-prefs.ts";
import { cn } from "../../lib/cn.ts";
import { Field } from "../ui/field.tsx";

type DeviceLists = {
  audioinput: MediaDeviceInfo[];
  audiooutput: MediaDeviceInfo[];
  videoinput: MediaDeviceInfo[];
};

type MediaSettingsPanelProps = {
  listDevices: () => Promise<DeviceLists>;
  switchDevice: (kind: MediaDeviceKindName, deviceId: string) => Promise<void>;
  setOutputVolume: (volume: number) => void;
  setInputVolume: (volume: number) => void;
};

function DeviceSelect({
  id,
  label,
  icon,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  options: MediaDeviceInfo[];
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden="true">
          {icon}
        </span>
        <select
          id={id}
          className="input-glow h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface-sunken pr-3 pl-10 text-sm text-ink"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.length === 0 ? <option value="">{label}</option> : null}
          {options.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || device.deviceId}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

function VolumeSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field id={id} label={label}>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full accent-[var(--accent)]"
      />
    </Field>
  );
}

function MicMeter({ level, bars = 20 }: { level: number; bars?: number }) {
  const lit = Math.round(level * bars);
  return (
    <div className="flex h-8 flex-1 items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-full min-w-0 flex-1 rounded-sm",
            i < lit ? "bg-accent" : "bg-surface-sunken",
          )}
        />
      ))}
    </div>
  );
}

export function MediaSettingsPanel({
  listDevices,
  switchDevice,
  setOutputVolume,
  setInputVolume,
}: MediaSettingsPanelProps) {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<DeviceLists>({
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  });
  const [prefs, setPrefs] = useState(readDevicePrefs);
  const [level, setLevel] = useState(0);
  const [testing, setTesting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<MediaStream | null>(null);
  const meterRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    void listDevices()
      .then(setDevices)
      .catch(() => toast.error(t("toast.mediaError")));
  }, [listDevices, t]);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: prefs.audioinput ? { deviceId: { exact: prefs.audioinput } } : true,
          video: prefs.videoinput ? { deviceId: { exact: prefs.videoinput } } : true,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        previewRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) toast.error(t("toast.mediaError"));
      }
    };
    void start();
    return () => {
      cancelled = true;
      previewRef.current?.getTracks().forEach((track) => track.stop());
      previewRef.current = null;
    };
  }, [prefs.audioinput, prefs.videoinput, t]);

  useEffect(() => {
    return () => {
      void meterRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = prefs.inputVolume;
  }, [prefs.inputVolume]);

  const persist = (next: typeof prefs) => {
    setPrefs(next);
    writeDevicePrefs(next);
  };

  const onDevice = async (kind: MediaDeviceKindName, deviceId: string) => {
    persist({ ...prefs, [kind]: deviceId });
    try {
      await switchDevice(kind, deviceId);
    } catch {
      toast.error(t("toast.mediaError"));
    }
  };

  const onOutputVolume = (value: number) => {
    persist({ ...prefs, outputVolume: value });
    setOutputVolume(value);
  };

  const onInputVolume = (value: number) => {
    persist({ ...prefs, inputVolume: value });
    setInputVolume(value);
  };

  const testMic = async () => {
    if (testing) {
      setTesting(false);
      void meterRef.current?.close();
      meterRef.current = null;
      gainRef.current = null;
      setLevel(0);
      return;
    }
    const track = previewRef.current?.getAudioTracks()[0];
    if (!track) {
      toast.error(t("toast.mediaError"));
      return;
    }
    const ctx = new AudioContext();
    meterRef.current = ctx;
    const source = ctx.createMediaStreamSource(new MediaStream([track]));
    const gain = ctx.createGain();
    gain.gain.value = prefs.inputVolume;
    gainRef.current = gain;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(gain);
    gain.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    setTesting(true);
    const loop = () => {
      if (!meterRef.current) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, n) => sum + n, 0) / data.length / 255;
      setLevel(avg);
      requestAnimationFrame(loop);
    };
    loop();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <DeviceSelect
          id="audio-input"
          label={t("settings.audioInput")}
          icon={<IconMicrophone className="size-4" />}
          value={prefs.audioinput ?? devices.audioinput[0]?.deviceId ?? ""}
          options={devices.audioinput}
          onChange={(value) => void onDevice("audioinput", value)}
        />
        <VolumeSlider
          id="input-volume"
          label={t("settings.inputVolume")}
          value={prefs.inputVolume}
          onChange={onInputVolume}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          className="label-caps min-h-11 shrink-0 rounded-[var(--radius-control)] bg-accent px-4 text-ink-on-accent hover:bg-accent-hover"
          onClick={() => void testMic()}
          aria-pressed={testing}
        >
          {testing ? t("settings.stopMicTest") : t("settings.testMic")}
        </button>
        <MicMeter level={testing ? level : 0} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DeviceSelect
          id="audio-output"
          label={t("settings.audioOutput")}
          icon={<IconHeadphones className="size-4" />}
          value={prefs.audiooutput ?? devices.audiooutput[0]?.deviceId ?? ""}
          options={devices.audiooutput}
          onChange={(value) => void onDevice("audiooutput", value)}
        />
        <VolumeSlider
          id="output-volume"
          label={t("settings.outputVolume")}
          value={prefs.outputVolume}
          onChange={onOutputVolume}
        />
      </div>
      <DeviceSelect
        id="video-input"
        label={t("settings.videoInput")}
        icon={<IconVideo className="size-4" />}
        value={prefs.videoinput ?? devices.videoinput[0]?.deviceId ?? ""}
        options={devices.videoinput}
        onChange={(value) => void onDevice("videoinput", value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-black">
          <video ref={videoRef} className="aspect-video h-auto w-full object-cover" muted playsInline />
        </div>
        <p className="self-center text-sm text-ink-muted">{t("settings.previewHint")}</p>
      </div>
    </div>
  );
}
