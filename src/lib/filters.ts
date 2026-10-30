// The movie list's search, filters and sort: kept in the page's URL (in Portuguese, to share and go back), sent to
// `GET /movies` (in the API's terms)
import type { Category, RatingKey } from './types';

export type MovieSort = 'recent' | 'rating' | 'popular';

export interface MovieFilters {
  q: string;
  category: Category | null;
  genre: string | null;
  minRating: RatingKey | null;
  ratedBy: string | null;
  unratedByMe: boolean;
  sort: MovieSort;
}

export const DEFAULT_FILTERS: MovieFilters = {
  q: '',
  category: null,
  genre: null,
  minRating: null,
  ratedBy: null,
  unratedByMe: false,
  sort: 'recent',
};

/** URL value ↔ API value, for the parameters with a fixed set of values */
const CATEGORY_SLUGS: Record<Category, string> = { movie: 'filmes', series: 'series' };
const RATING_SLUGS: Partial<Record<RatingKey, string>> = {
  UNMISSABLE: 'imperdivel',
  VERY_GOOD: 'muito-bom',
  GOOD: 'bom',
  COOL: 'legal',
  BAD: 'ruinzinho',
  VERY_BAD: 'muito-ruim',
};
const SORT_SLUGS: Record<MovieSort, string> = { recent: 'recentes', rating: 'melhores', popular: 'populares' };

const fromSlug = <T extends string>(slugs: Partial<Record<T, string>>, slug: string | null) => (
  (Object.entries(slugs) as [T, string][]).find(([, value]) => value === slug)?.[0] ?? null
);

/** Unknown or malformed values fall back to the defaults. */
export function parseFilters(search: string): MovieFilters {
  const params = new URLSearchParams(search);
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    category: fromSlug(CATEGORY_SLUGS, params.get('tipo')),
    genre: params.get('genero') || null,
    minRating: fromSlug(RATING_SLUGS, params.get('nota')),
    ratedBy: params.get('por') || null,
    unratedByMe: params.get('nao-avaliados') === '1',
    sort: fromSlug(SORT_SLUGS, params.get('ordem')) ?? 'recent',
  };
}

/** The page's query string, without the defaults; '' without filters. */
export function filtersToSearch(filters: MovieFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('tipo', CATEGORY_SLUGS[filters.category]);
  if (filters.genre) params.set('genero', filters.genre);
  if (filters.minRating) params.set('nota', RATING_SLUGS[filters.minRating] ?? '');
  if (filters.ratedBy) params.set('por', filters.ratedBy);
  if (filters.unratedByMe) params.set('nao-avaliados', '1');
  if (filters.sort !== 'recent') params.set('ordem', SORT_SLUGS[filters.sort]);
  const search = params.toString();
  return search && `?${search}`;
}

/** `GET /movies` parameters, without the defaults; '' without filters. */
export function filtersToApiQuery(filters: MovieFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.ratedBy) params.set('ratedBy', filters.ratedBy);
  if (filters.unratedByMe) params.set('unratedByMe', 'true');
  if (filters.sort !== 'recent') params.set('sort', filters.sort);
  return params.toString();
}

/** How many filters narrow the list (the sort doesn't count). */
export const countActiveFilters = (filters: MovieFilters) => [
  filters.q, filters.category, filters.genre, filters.minRating, filters.ratedBy, filters.unratedByMe,
].filter(Boolean).length;
