/** Money helpers — amounts stored as integer euro cents. */

export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

export function centsToEur(cents: number): number {
  return cents / 100;
}

export function formatEurFromCents(cents: number): string {
  const eur = centsToEur(cents);
  const formatted = new Intl.NumberFormat("sl-SI", {
    minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(eur);
  return `${formatted} €`;
}

export function formatEur(eur: number): string {
  return formatEurFromCents(eurToCents(eur));
}
