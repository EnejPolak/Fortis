/** Mobile-only visual break between brand collections on /kolekcija. Hidden from md up via CSS. */
export function KolekcijaCollectionTransition() {
  return (
    <div className="kolekcija-collection-transition" aria-hidden="true">
      <div className="kolekcija-collection-transition-line" />
    </div>
  );
}
