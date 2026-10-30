'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  filtersToSearch, parseFilters, type MovieFilters,
} from '@/lib/filters';

const FILTERS_CHANGE_EVENT = 'moviefilterschange';
export const FILTERS_ELEMENT_ID = 'movie-filters';

/** Where the list was, per set of filters (see MovieList) */
export const scrollPositionKey = (search: string) => `scrollPosition${search}`;

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  window.addEventListener(FILTERS_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(FILTERS_CHANGE_EVENT, onChange);
  };
};

// The page is prerendered without filters (useSearchParams would take the list out of the static HTML), so the server
// and hydration see none; the URL's filters apply right after
const getSearch = () => window.location.search;
const getServerSearch = () => '';

// The same object for the same URL, so it can be a dependency
let cached: { search: string; filters: MovieFilters } | null = null;
const filtersFor = (search: string) => {
  if (cached?.search !== search) cached = { search, filters: parseFilters(search) };
  return cached.filters;
};

/** The movie list's filters, in the URL. */
export default function useMovieFilters() {
  const filters = filtersFor(useSyncExternalStore(subscribe, getSearch, getServerSearch));

  /** `replace` for typing in the search box: one history entry per search, not per letter. */
  const setFilters = useCallback((change: Partial<MovieFilters>, { replace = false } = {}) => {
    const current = filtersToSearch(parseFilters(window.location.search));
    const next = filtersToSearch({ ...parseFilters(window.location.search), ...change });
    if (next === current) return;

    // A new set of filters starts at the top of the list, not where it was left last time
    window.sessionStorage.removeItem(scrollPositionKey(next));
    const url = `${window.location.pathname}${next}`;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    window.dispatchEvent(new Event(FILTERS_CHANGE_EVENT));

    // Keeps the filter bar in view when the list was scrolled past it
    const bar = document.getElementById(FILTERS_ELEMENT_ID);
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
  }, []);

  return { filters, search: filtersToSearch(filters), setFilters };
}
