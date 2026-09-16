type Props = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function FilterCheckbox({ id, label, checked, onChange }: Props) {
  return (
    <label className="kolekcija-filter-check" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="kolekcija-filter-check-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="kolekcija-filter-check-box" aria-hidden="true" />
      <span className="kolekcija-filter-check-label">{label}</span>
    </label>
  );
}
