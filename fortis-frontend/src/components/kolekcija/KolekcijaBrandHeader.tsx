import type { KolekcijaBrandMeta } from "@/data/kolekcija-brands";

type Props = {
  meta: KolekcijaBrandMeta;
};

export function KolekcijaBrandHeader({ meta }: Props) {
  return (
    <header className="kolekcija-brand-header">
      <p className="kolekcija-brand-header-label">Kolekcija</p>
      <div className="kolekcija-brand-header-row kolekcija-brand-header-row--solo">
        <span className="kolekcija-brand-header-name">{meta.displayName}</span>
      </div>
    </header>
  );
}
