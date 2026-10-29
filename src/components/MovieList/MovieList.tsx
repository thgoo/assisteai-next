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

  // Load the next page near the bottom
  const loadMoreAtBottom = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop + 360
      >= document.documentElement.offsetHeight
      && !busy.current
    ) {
      nextPage();
    }
  }, [nextPage]);

  // Also checked without a scroll, whenever loading ends: the visitor may have reached the bottom before hydration, or
  // the list may not fill the screen at all
  useEffect(() => {
    busy.current = isLoading || !hasMore;
    loadMoreAtBottom();
  }, [isLoading, hasMore, loadMoreAtBottom]);

  useEffect(() => {
    window.addEventListener('scroll', loadMoreAtBottom);
    return () => window.removeEventListener('scroll', loadMoreAtBottom);
  }, [loadMoreAtBottom]);

  // Coming back to the list returns to where the visitor was. Once a movie is opened, scroll events no longer count:
  // the router swaps in the shorter movie page before the URL changes, and the browser clamps the scroll to it
  const leaving = useRef(false);
  const saveScrollPosition = useCallback(() => {
    if (leaving.current) return;
    window.sessionStorage.setItem(SCROLL_POSITION_KEY, String(document.documentElement.scrollTop));
  }, []);
  const onOpenMovie = useCallback(() => {
    saveScrollPosition();
    leaving.current = true;
  }, [saveScrollPosition]);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const scrollPosition = window.sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (scrollPosition) document.documentElement.scrollTop = Number(scrollPosition);

    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveScrollPosition, 20);
    };

    window.addEventListener('scroll', onScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', onScroll);
    };
  }, [saveScrollPosition]);

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
          onOpenMovie={onOpenMovie}
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
