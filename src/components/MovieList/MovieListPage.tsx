'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MovieSummary } from '@/lib/types';
import Movie from './Movie/Movie';
import classes from './style.module.scss';

/** How long a new page stays hidden waiting for its posters; then the slow ones show a placeholder */
const POSTERS_TIMEOUT_MS = 1000;

interface MovieListPageProps {
  movies: MovieSummary[];
  /** Hide the page until its posters load (pages loaded by scrolling) */
  waitForPosters: boolean;
  /** +1 while this page is hidden, -1 once it shows */
  onPendingChange: (delta: number) => void;
  onOpenMovie: () => void;
}

const MovieListPage = ({
  movies, waitForPosters, onPendingChange, onOpenMovie,
}: MovieListPageProps) => {
  const posters = movies.filter(movie => movie.posterUrl).length;
  const [settledPosters, setSettledPosters] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const visible = !waitForPosters || timedOut || settledPosters >= posters;

  useEffect(() => {
    if (visible) return undefined;

    onPendingChange(1);
    const timeout = setTimeout(() => setTimedOut(true), POSTERS_TIMEOUT_MS);
    return () => {
      clearTimeout(timeout);
      onPendingChange(-1);
    };
  }, [visible, onPendingChange]);

  return (
    <div className={visible ? classes.page : classes.hiddenPage}>
      {movies.map(movie => (
        <div className={classes.gridItem} key={movie.id}>
          <Link href={`/movies/${movie.id}-${movie.slug}`} className={classes.itemWrapper} onClick={onOpenMovie}>
            <Movie movie={movie} onPosterSettled={() => setSettledPosters(count => count + 1)} />
          </Link>
        </div>
      ))}
    </div>
  );
};

export default MovieListPage;
