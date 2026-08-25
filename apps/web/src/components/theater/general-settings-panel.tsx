import { AppearanceFields } from "../chrome/appearance-fields.tsx";
import { PwaInstallAction } from "../chrome/pwa-install.tsx";

export function GeneralSettingsPanel() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-1">
      <AppearanceFields />
      <PwaInstallAction />
    </div>
  );
}
