const HERO_REVEAL_SESSION_KEY = "fortis-hero-reveal-seen";

export const HERO_REVEAL_COMPLETE_EVENT = "fortis-hero-reveal-complete";

export function hasHeroRevealPlayed() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(HERO_REVEAL_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function markHeroRevealPlayed() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(HERO_REVEAL_SESSION_KEY, "true");
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event(HERO_REVEAL_COMPLETE_EVENT));
}
