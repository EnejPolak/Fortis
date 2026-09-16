"use client";

import { SCENT_FAMILY_OPTIONS, type ScentFamilySlug } from "@/data/scent-families";
import {
  countActiveFilters,
  isFiltersEmpty,
  type BrandFilterOption,
  type KolekcijaFilterState,
} from "@/lib/kolekcija-filter";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FilterCheckbox } from "./FilterCheckbox";

type PanelKey = "brand" | "family" | null;

type Props = {
  filters: KolekcijaFilterState;
  onChange: (next: KolekcijaFilterState) => void;
  brandOptions: BrandFilterOption[];
  resultCount: number;
};

function toggleInList<T extends string>(list: T[], value: T, on: boolean): T[] {
  if (on) return list.includes(value) ? list : [...list, value];
  return list.filter((v) => v !== value);
}

export function CollectionFilters({ filters, onChange, brandOptions, resultCount }: Props) {
  const baseId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const hasFilters = !isFiltersEmpty(filters);

  const closeAll = useCallback(() => {
    setOpenPanel(null);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  useEffect(() => {
    if (!openPanel) return;
    const onPointer = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenPanel(null);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [openPanel]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const reset = () => onChange({ brands: [], families: [] });

  const setBrand = (slug: string, checked: boolean) => {
    onChange({
      ...filters,
      brands: toggleInList(filters.brands, slug, checked),
    });
  };

  const setFamily = (slug: ScentFamilySlug, checked: boolean) => {
    onChange({
      ...filters,
      families: toggleInList(filters.families, slug, checked),
    });
  };

  const brandLabelBySlug = (slug: string) =>
    brandOptions.find((b) => b.slug === slug)?.label ?? slug;

  const familyLabelBySlug = (slug: ScentFamilySlug) =>
    SCENT_FAMILY_OPTIONS.find((f) => f.slug === slug)?.label ?? slug;

  const brandTriggerLabel =
    filters.brands.length > 0 ? `Znamka · ${filters.brands.length}` : "Znamka";
  const familyTriggerLabel =
    filters.families.length > 0 ? `Družina vonja · ${filters.families.length}` : "Družina vonja";

  const checkboxGroups = (
    <>
      <div className="kolekcija-filter-group">
        <p className="kolekcija-filter-group-title">Znamka</p>
        <div className="kolekcija-filter-group-list">
          {brandOptions.map((opt) => (
            <FilterCheckbox
              key={opt.slug}
              id={`${baseId}-brand-${opt.slug}`}
              label={opt.label}
              checked={filters.brands.includes(opt.slug)}
              onChange={(checked) => setBrand(opt.slug, checked)}
            />
          ))}
        </div>
      </div>
      <div className="kolekcija-filter-group">
        <p className="kolekcija-filter-group-title">Družina vonja</p>
        <div className="kolekcija-filter-group-list">
          {SCENT_FAMILY_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt.slug}
              id={`${baseId}-family-${opt.slug}`}
              label={opt.label}
              checked={filters.families.includes(opt.slug)}
              onChange={(checked) => setFamily(opt.slug, checked)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="kolekcija-filters" ref={barRef}>
      <div className="kolekcija-filters-bar kolekcija-filters-bar--desktop">
        <span className="kolekcija-filters-title">Filtri</span>
        <div className="kolekcija-filters-triggers">
          <div className="kolekcija-filter-dropdown-wrap">
            <button
              type="button"
              className={`kolekcija-filter-trigger${openPanel === "brand" ? " kolekcija-filter-trigger--open" : ""}${filters.brands.length ? " kolekcija-filter-trigger--active" : ""}`}
              aria-expanded={openPanel === "brand"}
              aria-controls={`${baseId}-panel-brand`}
              onClick={() => setOpenPanel((p) => (p === "brand" ? null : "brand"))}
            >
              {brandTriggerLabel}
            </button>
            {openPanel === "brand" ? (
              <div
                id={`${baseId}-panel-brand`}
                className="kolekcija-filter-panel"
                role="region"
                aria-label="Filter znamka"
              >
                <div className="kolekcija-filter-group-list kolekcija-filter-group-list--panel">
                  {brandOptions.map((opt) => (
                    <FilterCheckbox
                      key={opt.slug}
                      id={`${baseId}-desk-brand-${opt.slug}`}
                      label={opt.label}
                      checked={filters.brands.includes(opt.slug)}
                      onChange={(checked) => setBrand(opt.slug, checked)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="kolekcija-filter-dropdown-wrap">
            <button
              type="button"
              className={`kolekcija-filter-trigger${openPanel === "family" ? " kolekcija-filter-trigger--open" : ""}${filters.families.length ? " kolekcija-filter-trigger--active" : ""}`}
              aria-expanded={openPanel === "family"}
              aria-controls={`${baseId}-panel-family`}
              onClick={() => setOpenPanel((p) => (p === "family" ? null : "family"))}
            >
              {familyTriggerLabel}
            </button>
            {openPanel === "family" ? (
              <div
                id={`${baseId}-panel-family`}
                className="kolekcija-filter-panel"
                role="region"
                aria-label="Filter družina vonja"
              >
                <div className="kolekcija-filter-group-list kolekcija-filter-group-list--panel">
                  {SCENT_FAMILY_OPTIONS.map((opt) => (
                    <FilterCheckbox
                      key={opt.slug}
                      id={`${baseId}-desk-family-${opt.slug}`}
                      label={opt.label}
                      checked={filters.families.includes(opt.slug)}
                      onChange={(checked) => setFamily(opt.slug, checked)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="kolekcija-filters-bar-end">
          {hasFilters ? (
            <span className="kolekcija-filters-count">
              {resultCount} {resultCount === 1 ? "parfum" : "parfumov"}
            </span>
          ) : null}
          {hasFilters ? (
            <button type="button" className="kolekcija-filter-reset" onClick={reset}>
              Ponastavi
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="kolekcija-filters-mobile-trigger"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <span>Filtri</span>
        {activeCount > 0 ? <span className="kolekcija-filters-mobile-badge">{activeCount}</span> : null}
      </button>

      {hasFilters ? (
        <div className="kolekcija-filter-tags" aria-label="Aktivni filtri">
          {filters.brands.map((slug) => (
            <button
              key={`b-${slug}`}
              type="button"
              className="kolekcija-filter-tag"
              onClick={() => setBrand(slug, false)}
            >
              {brandLabelBySlug(slug)} <span aria-hidden="true">×</span>
            </button>
          ))}
          {filters.families.map((slug) => (
            <button
              key={`f-${slug}`}
              type="button"
              className="kolekcija-filter-tag"
              onClick={() => setFamily(slug, false)}
            >
              {familyLabelBySlug(slug)} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="kolekcija-filter-drawer-root" role="presentation">
          <button
            type="button"
            className="kolekcija-filter-drawer-backdrop"
            aria-label="Zapri filtre"
            onClick={closeAll}
          />
          <div className="kolekcija-filter-drawer" role="dialog" aria-modal="true" aria-label="Filtri">
            <div className="kolekcija-filter-drawer-head">
              <span className="kolekcija-filter-drawer-title">Filtri</span>
              <button type="button" className="kolekcija-filter-drawer-close" onClick={closeAll}>
                ×
              </button>
            </div>
            <div className="kolekcija-filter-drawer-body">{checkboxGroups}</div>
            <div className="kolekcija-filter-drawer-foot">
              <button type="button" className="kolekcija-filter-drawer-apply" onClick={closeAll}>
                Prikaži {resultCount} {resultCount === 1 ? "parfum" : "parfumov"}
              </button>
              {hasFilters ? (
                <button type="button" className="kolekcija-filter-drawer-reset" onClick={reset}>
                  Ponastavi filtre
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
