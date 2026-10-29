'use client';

import { createContext, useContext, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import type { MovieSummary, Page } from '@/lib/types';

interface MovieListContextValue {
  pages: Page<MovieSummary>[] | undefined;
  isValidating: boolean;
  hasMore: boolean;
  nextPage: () => void;
  refresh: () => void;
}

const MovieListContext = createContext<MovieListContextValue | null>(null);

const getKey = (pageIndex: number, previousPage: Page<MovieSummary> | null) => {
  if (pageIndex === 0) return '/movies';
  if (!previousPage?.nextCursor) return null; // reached the end

  return `/movies?cursor=${encodeURIComponent(previousPage.nextCursor)}`;
};

interface MovieListProviderProps {
  children: React.ReactNode;
  /** The first page, rendered on the server */
  firstPage?: Page<MovieSummary>;
}

export default function MovieListProvider({ children, firstPage }: MovieListProviderProps) {
  const {
    data, mutate, size, setSize, isValidating,
  } = useSWRInfinite<Page<MovieSummary>>(getKey, { fallbackData: firstPage ? [firstPage] : undefined });

  const value = useMemo(() => ({
    pages: data,
    isValidating,
    hasMore: !data || data[data.length - 1].nextCursor !== null,
    nextPage: () => setSize(size + 1),
    refresh: () => mutate(),
  }), [data, isValidating, size, setSize, mutate]);

  return <MovieListContext.Provider value={value}>{children}</MovieListContext.Provider>;
}

export const useMovieList = () => {
  const context = useContext(MovieListContext);
  if (!context) throw new Error('useMovieList must be used inside <MovieListProvider>');

  return context;
};
