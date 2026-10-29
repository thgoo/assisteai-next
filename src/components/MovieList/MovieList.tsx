'use client';

import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import Spinner from '../Spinner/Spinner';
import { useMovieList } from './MovieListProvider';
import MovieListPage from './MovieListPage';
import classes from './style.module.scss';

const SCROLL_POSITION_KEY = 'scrollPosition';

const MovieList = () => {
  const {
    pages, nextPage, isValidating, hasMore,
  } = useMovieList();
  // Pages already there when the list mounts show at once: the server-rendered one, and the cached ones when coming
  // back, so the scroll position can be restored
  const [initialPageCount] = useState(pages?.length ?? 0);
  // Pages loaded by scrolling, still hidden while their posters load
  const [pendingPages, setPendingPages] = useState(0);
  const onPendingChange = useCallback((delta: number) => setPendingPages(count => count + delta), []);
  const isLoading = isValidating || pendingPages > 0;
  const busy = useRef(isLoading);

  useEffect(() => {
    busy.current = isLoading || !hasMore;
  }, [isLoading, hasMore]);

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
      {pages.map((page, i) => (
        <MovieListPage
          // Pages only ever append, and a refresh keeps their order
          key={i}
          movies={page.data}
          waitForPosters={i >= initialPageCount}
          onPendingChange={onPendingChange}
        />
      ))}
      {isLoading ? (
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
