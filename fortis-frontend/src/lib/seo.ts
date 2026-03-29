export function toMetaDescription(text: string, fallback: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  if (t.length <= 160) return t;
  return `${t.slice(0, 157).trimEnd()}…`;
}
