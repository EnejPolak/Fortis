export const MARKETING_CONSENT_STORAGE_KEY = "fortis_marketing_consent";

export const REOPEN_COOKIE_CONSENT_EVENT = "fortis-reopen-cookie-consent";

export type MarketingConsentValue = "accepted" | "declined";

export function readMarketingConsent(): MarketingConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeMarketingConsent(value: MarketingConsentValue) {
  try {
    localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearMarketingConsent() {
  try {
    localStorage.removeItem(MARKETING_CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
