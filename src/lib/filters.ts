// The movie list's search, filters and sort: kept in the page's URL (to share and go back) with the same parameters as
// `GET /movies`
import { RATING_LABELS } from './ratings';
import type { Category, RatingKey } from './types';

export type MovieSort = 'recent' | 'rating' | 'popular';

export interface MovieFilters {
  q: string;
  category: Category | null;
  genre: string | null;
  /** Rating averages to keep (none: any) */
  averages: RatingKey[];
  ratedBy: string | null;
  unratedByMe: boolean;
  sort: MovieSort;
}

export const DEFAULT_FILTERS: MovieFilters = {
  q: '',
  category: null,
  genre: null,
  averages: [],
  ratedBy: null,
  unratedByMe: false,
  sort: 'recent',
};

const CATEGORIES: Category[] = ['movie', 'series'];
const SORTS: MovieSort[] = ['recent', 'rating', 'popular'];
// Best first, like the labels
const RATING_ORDER = Object.keys(RATING_LABELS) as RatingKey[];

const oneOf = <T extends string>(values: readonly T[], value: string | null) => (
  values.includes(value as T) ? value as T : null
);

/** Unknown or malformed values fall back to the defaults. */
export function parseFilters(search: string): MovieFilters {
  const params = new URLSearchParams(search);
  const averages = new Set((params.get('average') ?? '').split(','));
  const ratedBy = params.get('ratedBy');
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    category: oneOf(CATEGORIES, params.get('category')),
    genre: params.get('genre') || null,
    averages: RATING_ORDER.filter(key => averages.has(key)),
    ratedBy: ratedBy && /^\d+$/.test(ratedBy) ? ratedBy : null,
    unratedByMe: params.get('unratedByMe') === 'true',
    sort: oneOf(SORTS, params.get('sort')) ?? 'recent',
  };
}

/** `GET /movies` parameters, without the defaults; '' without filters. Also the page's query string. */
export function filtersToQuery(filters: MovieFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.averages.length) params.set('average', filters.averages.join(','));
  if (filters.ratedBy) params.set('ratedBy', filters.ratedBy);
  if (filters.unratedByMe) params.set('unratedByMe', 'true');
  if (filters.sort !== 'recent') params.set('sort', filters.sort);
  // Readable lists in the address bar: average=UNMISSABLE,VERY_GOOD
  return params.toString().replaceAll('%2C', ',');
}

/** The page's query string ('?…'), '' without filters. */
export const filtersToSearch = (filters: MovieFilters) => {
  const query = filtersToQuery(filters);
  return query && `?${query}`;
};

/** How many filters narrow the list (the sort doesn't count). */
export const countActiveFilters = (filters: MovieFilters) => [
  filters.q, filters.category, filters.genre, filters.averages.length, filters.ratedBy, filters.unratedByMe,
].filter(Boolean).length;
