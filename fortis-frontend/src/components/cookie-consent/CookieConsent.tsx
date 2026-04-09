"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  REOPEN_COOKIE_CONSENT_EVENT,
  clearMarketingConsent,
  readMarketingConsent,
  writeMarketingConsent,
} from "@/lib/cookie-consent";

const FACEBOOK_PIXEL_ID = "919444914037646";

type UiConsent = "pending" | "accepted" | "declined";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<UiConsent>("pending");
  const skipNextPathPageView = useRef(true);

  useEffect(() => {
    const stored = readMarketingConsent();
    if (stored === "accepted") setConsent("accepted");
    else if (stored === "declined") setConsent("declined");
  }, []);

  const accept = useCallback(() => {
    writeMarketingConsent("accepted");
    setConsent("accepted");
    skipNextPathPageView.current = true;
  }, []);

  const decline = useCallback(() => {
    writeMarketingConsent("declined");
    setConsent("declined");
  }, []);

  const reopen = useCallback(() => {
    clearMarketingConsent();
    setConsent("pending");
    skipNextPathPageView.current = true;
  }, []);

  useEffect(() => {
    const onReopen = () => reopen();
    window.addEventListener(REOPEN_COOKIE_CONSENT_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_COOKIE_CONSENT_EVENT, onReopen);
  }, [reopen]);

  useEffect(() => {
    if (consent !== "accepted") return;
    if (skipNextPathPageView.current) {
      skipNextPathPageView.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, consent]);

  return (
    <>
      {consent === "accepted" ? (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FACEBOOK_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}

      {consent === "pending" ? (
        <div
          className="cookie-consent-bar"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
        >
          <div className="cookie-consent-inner">
            <h2 id="cookie-consent-title" className="cookie-consent-title">
              Piškotki in zasebnost
            </h2>
            <p id="cookie-consent-desc" className="cookie-consent-text">
              Za merjenje učinkovitosti oglasov uporabljamo piškotke tretjih oseb
              (Meta). Brez vaše privolitve teh ne naložimo. Več informacij najdete
              v{" "}
              <Link href="/privacy-policy" className="cookie-consent-link">
                politiki zasebnosti
              </Link>
              .
            </p>
            <div className="cookie-consent-actions">
              <button
                type="button"
                className="cookie-consent-btn cookie-consent-btn-decline"
                onClick={decline}
              >
                Zavrnem
              </button>
              <button
                type="button"
                className="cookie-consent-btn cookie-consent-btn-accept"
                onClick={accept}
              >
                Sprejmem
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
