import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";
import logoMark from "../../assets/amphitheatre-logo-512.webp";
import logoFull from "../../assets/amphitheatre-logo-full-1000.webp";

export function BrandMark({
  className,
  overrideClasses = false,
}: {
  className?: string;
  overrideClasses?: boolean;
}) {
  return (
    <span
      className={cn(
        !overrideClasses
          ? "size-10 overflow-hidden rounded-full border border-border bg-surface-sunken/80"
          : "",
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={logoMark}
        alt=""
        width={40}
        height={40}
        className="size-full object-cover"
      />
    </span>
  );
}

type BrandWordmarkProps = {
  className?: string;
  overrideClasses?: boolean;
  /** Empty alt when a parent already names the control. */
  decorative?: boolean;
};

export function BrandWordmark({
  className,
  overrideClasses = false,
  decorative = false,
}: BrandWordmarkProps) {
  const { t } = useTranslation();
  return (
    <img
      src={logoFull}
      alt={decorative ? "" : t("app.name")}
      className={cn(
        !overrideClasses
          ? "h-9 w-auto max-w-[11rem] object-contain sm:h-10 sm:max-w-[14rem]"
          : "",
        className,
      )}
    />
  );
}
