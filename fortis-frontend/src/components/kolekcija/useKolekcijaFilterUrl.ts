"use client";

import {
  buildKolekcijaFilterSearchParams,
  parseKolekcijaFiltersFromSearchParams,
  type KolekcijaFilterState,
} from "@/lib/kolekcija-filter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useKolekcijaFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseKolekcijaFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: KolekcijaFilterState) => {
      const query = buildKolekcijaFilterSearchParams(next);
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router]
  );

  return { filters, setFilters };
}
