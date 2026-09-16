import Image from "next/image";
import type { KolekcijaBrandMeta } from "@/data/kolekcija-brands";

type Props = {
  meta: KolekcijaBrandMeta;
};

export function KolekcijaBrandHeader({ meta }: Props) {
  const hasLogo = Boolean(meta.logo);
  const hasTagline = Boolean(meta.tagline?.trim());

  return (
    <header className="kolekcija-brand-header">
      <p className="kolekcija-brand-header-label">Kolekcija</p>

      <div
        className={
          hasLogo
            ? "kolekcija-brand-header-row"
            : "kolekcija-brand-header-row kolekcija-brand-header-row--solo"
        }
      >
        <span className="kolekcija-brand-header-name">{meta.displayName}</span>
        {hasLogo ? (
          <>
            <span className="kolekcija-brand-header-divider" aria-hidden="true" />
            <div className="kolekcija-brand-header-logo">
              <Image
                src={meta.logo!}
                alt=""
                width={320}
                height={72}
                className="kolekcija-brand-header-logo-img"
              />
            </div>
          </>
        ) : null}
      </div>

      {hasTagline ? <p className="kolekcija-brand-header-tagline">{meta.tagline}</p> : null}
    </header>
  );
}
