"use client";

import { REOPEN_COOKIE_CONSENT_EVENT } from "@/lib/cookie-consent";

export function FooterCookiesButton() {
  return (
    <button
      type="button"
      className="footer-link footer-link-button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(REOPEN_COOKIE_CONSENT_EVENT));
      }}
    >
      Piškotki
    </button>
  );
}
