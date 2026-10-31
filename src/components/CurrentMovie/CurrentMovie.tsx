'use client';

import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import type { MovieSummary } from '@/lib/types';

/** What the "Nova indicação" form needs to find the movie on screen among TMDb's titles */
export type TitleSuggestion = Pick<MovieSummary, 'title' | 'originalTitle' | 'year' | 'category'>;

interface CurrentMovieContextValue {
  movie: TitleSuggestion | null;
  setMovie: (movie: TitleSuggestion | null) => void;
}

const CurrentMovieContext = createContext<CurrentMovieContextValue | null>(null);

export function CurrentMovieProvider({ children }: { children: React.ReactNode }) {
  const [movie, setMovie] = useState<TitleSuggestion | null>(null);
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
export const CurrentMovie = ({
  title, originalTitle, year, category,
}: TitleSuggestion) => {
  const context = useContext(CurrentMovieContext);
  const setMovie = context?.setMovie;

  useEffect(() => {
    setMovie?.({
      title, originalTitle, year, category,
    });
    return () => setMovie?.(null);
  }, [setMovie, title, originalTitle, year, category]);

  return null;
};
