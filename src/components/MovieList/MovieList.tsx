'use client';

import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { countActiveFilters, DEFAULT_FILTERS } from '@/lib/filters';
import useMovieFilters, { scrollPositionKey } from '../MovieFilters/useMovieFilters';
import Spinner from '../Spinner/Spinner';
import { useMovieList } from './MovieListProvider';
import MovieListPage from './MovieListPage';
import classes from './style.module.scss';

/** How long to wait for the list to be tall enough to scroll back to the saved position */
const RESTORE_TIMEOUT_MS = 2000;

/** One list per set of filters (`key`), each with its own pages and scroll position. */
const MovieList = () => {
  const { search } = useMovieFilters();

  return <FilteredMovieList key={search} search={search} />;
};

const FilteredMovieList = ({ search }: { search: string }) => {
  const {
    pages, nextPage, isValidating, isStale, failed, hasMore,
  } = useMovieList();
  const { filters, setFilters } = useMovieFilters();
  const scrollKey = scrollPositionKey(search);
  // Pages the scroll asked for, hidden while their posters load. Pages from the server or SWR's cache (coming back to
  // the list) show at once, so the scroll position can be restored
  const [scrolledPages, setScrolledPages] = useState<number[]>([]);
  const [pendingPages, setPendingPages] = useState(0);
  const onPendingChange = useCallback((delta: number) => setPendingPages(count => count + delta), []);
  const isLoading = isValidating || pendingPages > 0;
  const busy = useRef(isLoading);
  // Until the saved position is back, scroll events neither save it nor load more
  const restoring = useRef(true);
  const pageCount = pages?.length ?? 0;

  // Load the next page near the bottom
  const loadMoreAtBottom = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop + 360
      >= document.documentElement.offsetHeight
      && !busy.current
      && !restoring.current
    ) {
      setScrolledPages(indexes => [...indexes, pageCount]);
      nextPage();
    }
  }, [nextPage, pageCount]);

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
    if (leaving.current || restoring.current) return;
    window.sessionStorage.setItem(scrollKey, String(document.documentElement.scrollTop));
  }, [scrollKey]);
  const onOpenMovie = useCallback(() => {
    saveScrollPosition();
    leaving.current = true;
  }, [saveScrollPosition]);

  /** Scrolls back once the list is tall enough (cached pages can arrive right after mounting), or anyway when `force`. */
  const restoreScrollPosition = useCallback((force: boolean) => {
    if (!restoring.current) return;
    const saved = window.sessionStorage.getItem(scrollKey);
    const maxScroll = document.documentElement.offsetHeight - window.innerHeight;
    if (saved !== null && Number(saved) > maxScroll && !force) return;

    // Nothing saved (first visit): leave the scroll alone, the visitor may have scrolled before hydration
    if (saved !== null) document.documentElement.scrollTop = Number(saved);
    restoring.current = false;
    loadMoreAtBottom();
  }, [loadMoreAtBottom, scrollKey]);

  // The give-up timer below must call the latest one, which knows the current page count
  const restoreRef = useRef(restoreScrollPosition);
  useEffect(() => {
    restoreRef.current = restoreScrollPosition;
    restoreScrollPosition(false);
  }, [restoreScrollPosition]);

  // Runs each time the list shows: with Cache Components, Next.js keeps a page it leaves mounted but hidden (React's
  // <Activity>), so coming back reruns effects while refs and state stay as they were
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    leaving.current = false;
    restoring.current = true;
    restoreRef.current(false);
    const giveUp = setTimeout(() => restoreRef.current(true), RESTORE_TIMEOUT_MS);

    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveScrollPosition, 20);
    };

    window.addEventListener('scroll', onScroll);
    return () => {
      clearTimeout(giveUp);
      clearTimeout(timeout);
      window.removeEventListener('scroll', onScroll);
    };
  }, [saveScrollPosition]);

  if (!pages?.[0]?.data.length && !isStale) {
    const hasFilters = countActiveFilters(filters) > 0;
    let text = 'Carregando...';
    if (failed) text = 'Não foi possível carregar a lista.';
    else if (pages) text = hasFilters ? 'Nenhum filme encontrado com esses filtros.' : 'Nenhum filme indicado.';

    return (
      <div className={`${classes.listText} magic-border light`}>
        {text}
        {pages && hasFilters ? (
          <button
            type="button"
            className={classes.clearFilters}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${classes.movieList} ${isStale ? classes.isStale : ''}`} aria-busy={isStale}>
      {(pages ?? []).map((page, i) => (
        <MovieListPage
          // Pages only ever append, and a refresh keeps their order
          key={i}
          movies={page.data}
          waitForPosters={scrolledPages.includes(i)}
          onPendingChange={onPendingChange}
          onOpenMovie={onOpenMovie}
        />
      ))}
      {isLoading && !isStale ? (
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
