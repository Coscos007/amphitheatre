export function inputEventValue(event: {
  currentTarget?: { value?: string } | null;
  target?: EventTarget | null;
}): string {
  const fromCurrent = event.currentTarget?.value;
  if (typeof fromCurrent === "string") return fromCurrent;
  const target = event.target;
  if (target && "value" in target && typeof (target as HTMLInputElement).value === "string") {
    return (target as HTMLInputElement).value;
  }
  return "";
}

export function inputEventChecked(event: { currentTarget?: { checked?: boolean } | null }): boolean {
  return Boolean(event.currentTarget?.checked);
}
