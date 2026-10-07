export const toMinor = (major: number): number => Math.round(major * 100);

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

export function formatRange(min: number, max: number, currency: string): string {
  return min === max ? formatMoney(max, currency) : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
}
