export type ShareInviteInput = {
  title: string;
  text: string;
  url: string;
};

export function canShareInvite(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareOrCopyInvite(
  input: ShareInviteInput,
): Promise<"shared" | "copied" | "aborted"> {
  if (canShareInvite()) {
    try {
      const payload: ShareData = {
        title: input.title,
        text: input.text,
        url: input.url,
      };
      if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
        await navigator.share({ title: input.title, text: input.text });
        return "shared";
      }
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "aborted";
      if (error instanceof Error && error.name === "AbortError") return "aborted";
    }
  }
  await navigator.clipboard.writeText(input.text);
  return "copied";
}
