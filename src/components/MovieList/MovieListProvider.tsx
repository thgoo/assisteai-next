'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo,
} from 'react';
import useSWRInfinite from 'swr/infinite';
import { ApiError } from '@/lib/api';
import { filtersToQuery } from '@/lib/filters';
import type { MovieSummary, Page } from '@/lib/types';
import useAuth from '../Auth/AuthProvider';
import useMovieFilters from '../MovieFilters/useMovieFilters';

interface MovieListContextValue {
  pages: Page<MovieSummary>[] | undefined;
  isValidating: boolean;
  /** The list couldn't load */
  failed: boolean;
  hasMore: boolean;
  nextPage: () => void;
}

/** Dispatched on `window` when a rating changes the list (the "Nova indicação" form lives in the header) */
export const MOVIES_CHANGED_EVENT = 'movieschange';

const MovieListContext = createContext<MovieListContextValue | null>(null);

interface MovieListProviderProps {
  children: React.ReactNode;
  /** The first page, rendered on the server */
  firstPage?: Page<MovieSummary>;
}

export default function MovieListProvider({ children, firstPage }: MovieListProviderProps) {
  const { filters } = useMovieFilters();
  const { isAuthenticated } = useAuth();
  // "Only the ones I haven't rated" needs a session (the API answers 401 without one)
  const query = filtersToQuery({ ...filters, unratedByMe: filters.unratedByMe && isAuthenticated });

  const getKey = useCallback((pageIndex: number, previousPage: Page<MovieSummary> | null) => {
    if (pageIndex > 0 && !previousPage?.nextCursor) return null; // reached the end

    const params = new URLSearchParams(query);
    if (previousPage?.nextCursor) params.set('cursor', previousPage.nextCursor);
    const search = params.toString();
    return search ? `/movies?${search}` : '/movies';
  }, [query]);

  const {
    data, error, mutate, size, setSize, isValidating,
  } = useSWRInfinite<Page<MovieSummary>>(getKey, {
    // The server renders the unfiltered list only
    fallbackData: firstPage && !query ? [firstPage] : undefined,
    // No automatic refetch of a list already in the cache. SWR defers that refetch to the next frame and runs it with
    // the latest `getKey`: when the filters change in between (at hydration, or on a quick change), the old filters'
    // cache got the new filters' pages. A list without cache is fetched at once, consistently; focus and
    // MOVIES_CHANGED_EVENT still refetch.
    revalidateIfStale: false,
    // No `keepPreviousData`: it keeps the last list SWR cached, not the one on screen (the server's unfiltered first
    // page never enters the cache), so <MovieList> holds the previous results itself
    onError: (err, key) => {
      // A cursor from before an API change (it now carries the sort): start the list over from the first page
      if (err instanceof ApiError && err.status === 422 && key.includes('cursor=')) {
        setSize(1).then(() => mutate());
      }
    },
  });

  useEffect(() => {
    const refresh = () => mutate();
    window.addEventListener(MOVIES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(MOVIES_CHANGED_EVENT, refresh);
  }, [mutate]);

  const value = useMemo(() => ({
    pages: data,
    isValidating,
    failed: !!error && !data,
    // After a failed page, no more automatic loading: the bottom check would retry it in a loop
    hasMore: !error && (!data || data[data.length - 1].nextCursor !== null),
    nextPage: () => setSize(size + 1),
  }), [data, error, isValidating, size, setSize]);

  return <MovieListContext.Provider value={value}>{children}</MovieListContext.Provider>;
}

export const useMovieList = () => {
  const context = useContext(MovieListContext);
  if (!context) throw new Error('useMovieList must be used inside <MovieListProvider>');

  return context;
};
