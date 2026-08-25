import { useTranslation } from "react-i18next";

export function HomeHero() {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl">
      <h1 className="hero-text font-display mb-6 text-[32px] leading-[1.1] font-extrabold tracking-tight whitespace-pre-line sm:text-[56px] xl:text-[64px]">
        {t("home.title")}
      </h1>
      <p className="font-sans mx-auto max-w-md text-lg leading-6 text-ink-muted xl:mx-0">
        {t("home.lead")}
      </p>
    </div>
  );
}
