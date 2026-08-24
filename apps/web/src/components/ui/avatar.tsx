import { cn } from "../../lib/cn.ts";
import { hueFromId, initials } from "../../lib/format.ts";

type AvatarProps = {
  id: string;
  name: string;
  size?: "sm" | "md";
  speaking?: boolean;
};

export function Avatar({ id, name, size = "md", speaking }: AvatarProps) {
  const hue = hueFromId(id);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-ink-on-accent",
        size === "sm" ? "size-8 text-xs" : "size-10 text-sm",
        speaking && "speaking-ring",
      )}
      style={{ background: `hsl(${hue} 28% 38%)` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
