'use client';

import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import type { MovieSummary } from '@/lib/types';

/** The movie on screen, as the "Nova indicação" form shows it, and who rated it already */
export type CurrentMovieInfo = Pick<MovieSummary, 'id' | 'title' | 'originalTitle' | 'year' | 'category' | 'posterUrl'>
  & { raterIds: number[] };

interface CurrentMovieContextValue {
  movie: CurrentMovieInfo | null;
  setMovie: (movie: CurrentMovieInfo | null) => void;
}

const CurrentMovieContext = createContext<CurrentMovieContextValue | null>(null);

export function CurrentMovieProvider({ children }: { children: React.ReactNode }) {
  const [movie, setMovie] = useState<CurrentMovieInfo | null>(null);
  const value = useMemo(() => ({ movie, setMovie }), [movie]);

  return <CurrentMovieContext.Provider value={value}>{children}</CurrentMovieContext.Provider>;
}

/** The movie whose page is on screen, if any: the header's "Nova indicação" starts from it. */
export const useCurrentMovie = () => {
  const context = useContext(CurrentMovieContext);
  if (!context) throw new Error('useCurrentMovie must be used inside <CurrentMovieProvider>');

  return context.movie;
};

/**
 * Rendered by a movie's page to mark it as the one on screen. Leaving the page (or Next.js hiding it, kept mounted in
 * an <Activity>) runs the cleanup.
 */
export const CurrentMovie = ({ movie }: { movie: CurrentMovieInfo }) => {
  const setMovie = useContext(CurrentMovieContext)?.setMovie;

  useEffect(() => {
    setMovie?.(movie);
    return () => setMovie?.(null);
  }, [setMovie, movie]);

  return null;
};
