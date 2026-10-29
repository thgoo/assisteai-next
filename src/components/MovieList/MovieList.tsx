'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Spinner from '../Spinner/Spinner';
import Movie from './Movie/Movie';
import { useMovieList } from './MovieListProvider';
import classes from './style.module.scss';

const SCROLL_POSITION_KEY = 'scrollPosition';

const MovieList = () => {
  const {
    pages, nextPage, isValidating, hasMore,
  } = useMovieList();
  const busy = useRef(isValidating);

  useEffect(() => {
    busy.current = isValidating || !hasMore;
  }, [isValidating, hasMore]);

  // Load the next page near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 360
        >= document.documentElement.offsetHeight
        && !busy.current
      ) {
        nextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextPage]);

  // Coming back to the list returns to where the visitor was
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const scrollPosition = window.sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (scrollPosition) document.documentElement.scrollTop = Number(scrollPosition);

    let timeout: ReturnType<typeof setTimeout>;
    const saveScrollPosition = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (window.location.pathname !== '/') return;
        window.sessionStorage.setItem(SCROLL_POSITION_KEY, String(document.documentElement.scrollTop));
      }, 20);
    };

    window.addEventListener('scroll', saveScrollPosition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, []);

  if (!pages?.[0]?.data.length) {
    return (
      <div className={`${classes.listText} magic-border light`}>
        {pages ? 'Nenhum filme indicado.' : 'Carregando...'}
      </div>
    );
  }

  return (
    <div className={classes.movieList}>
      {pages.map(page => page.data.map(movie => (
        <div className={classes.gridItem} key={movie.id}>
          <Link href={`/movies/${movie.id}-${movie.slug}`} className={classes.itemWrapper}>
            <Movie movie={movie} />
          </Link>
        </div>
      )))}
      {isValidating ? (
        <div className={classes.gridItem}>
          <div className={`${classes.itemWrapper} ${classes.isSpinner}`}>
            <Spinner />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MovieList;
