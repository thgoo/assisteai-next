import {
  useCallback, useEffect, useRef, useState, type PointerEvent,
} from 'react';
import Image from 'next/image';
import { RATING_LABELS, ratingLabel } from '@/lib/ratings';
import PosterTransition from '../../PosterTransition/PosterTransition';
import type { Category, MovieSummary, RatingKey } from '@/lib/types';
import { POSTER_SIZES } from './posters';
import classes from './style.module.scss';

const CATEGORIES: Record<Category, { name: string; css: string }> = {
  movie: { name: 'Filme', css: classes.movies },
  series: { name: 'Série', css: classes.series },
};

// Best first, as the API's keys
const RATING_KEYS = Object.keys(RATING_LABELS) as RatingKey[];

// The poster leans this far toward the pointer, like a print held in the hand
const MAX_TILT_DEG = 6;

const untilt = (element: HTMLElement | null) => {
  element?.style.removeProperty('--tilt-x');
  element?.style.removeProperty('--tilt-y');
  element?.classList.remove(classes.isLit);
};

/** Devices with a mouse, whose users don't ask for less motion */
const canTilt = () => window
  .matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;

type PosterStatus = 'loading' | 'loaded' | 'failed';

interface MovieProps {
  movie: MovieSummary;
  /** Clicked: the poster lies flat again, so it flies to the movie page as it is there */
  isOpening?: boolean;
  /** Called once the poster has loaded or failed */
  onPosterSettled?: () => void;
}

const Movie = ({ movie, isOpening = false, onPosterSettled }: MovieProps) => {
  const category = CATEGORIES[movie.category];
  const [posterStatus, setPosterStatus] = useState<PosterStatus>(movie.posterUrl ? 'loading' : 'failed');
  const [cached, setCached] = useState(false);
  const poster = useRef<HTMLDivElement>(null);

  // A poster already in the browser's cache (preloaded, or seen before) shows at once, without the shimmer or the fade
  const checkCached = useCallback((image: HTMLImageElement | null) => {
    if (!image?.complete || !image.naturalWidth) return;
    setCached(true);
    setPosterStatus('loaded');
  }, []);

  const settlePoster = (status: PosterStatus) => {
    setPosterStatus(status);
    onPosterSettled?.();
  };

  // Set on the element itself: re-rendering on every pointer move would be wasted work
  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const element = poster.current;
    if (!element || !canTilt()) return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    element.style.setProperty('--tilt-x', `${(0.5 - y) * MAX_TILT_DEG * 2}deg`);
    element.style.setProperty('--tilt-y', `${(x - 0.5) * MAX_TILT_DEG * 2}deg`);
    element.style.setProperty('--light-x', `${x * 100}%`);
    element.style.setProperty('--light-y', `${y * 100}%`);
    element.classList.add(classes.isLit);
  };

  // Clicked, the pointer never leaves: the list goes away under it. Flat again when it hides (kept mounted by Next.js),
  // or the poster would fly back to a leaning card
  useEffect(() => {
    const element = poster.current;
    return () => untilt(element);
  }, []);

  const { average, last, count } = movie.rating;
  // Segments lit on the meter: 7 for the best rating, 1 for the worst
  const litSegments = average ? RATING_KEYS.length - RATING_KEYS.indexOf(average) : 0;

  return (
    <div className={classes.card}>
      {/* The same name as the movie page's poster: navigating between them, the poster (frame included) flies from one
          place to the other */}
      <PosterTransition id={movie.id}>
        <div
          ref={poster}
          className={`${classes.movie} ${posterStatus === 'loading' ? classes.isLoading : ''} ${
            cached ? classes.isCached : ''} ${isOpening ? classes.isOpening : ''}`}
          onPointerMove={tilt}
          onPointerLeave={() => untilt(poster.current)}
          onClick={() => untilt(poster.current)}
        >
          {movie.posterUrl && posterStatus !== 'failed' ? (
            <Image
              src={movie.posterUrl}
              alt=""
              fill
              ref={checkCached}
              sizes={POSTER_SIZES}
              // Hidden pages of the list wait for their posters, which lazy images would never start
              loading="eager"
              className={`${classes.poster} ${posterStatus === 'loaded' ? classes.isLoaded : ''} ${
                cached ? classes.isCached : ''}`}
              onLoad={() => settlePoster('loaded')}
              onError={() => settlePoster('failed')}
            />
          ) : null}
          {posterStatus === 'failed' ? <div className={classes.posterNotAvailable}>Imagem não disponível</div> : null}
          <span className={classes.glare} />
        </div>
      </PosterTransition>
      <div className={`${classes.caption} ${average ? classes[average] : ''}`}>
        <div className={classes.title}>{movie.originalTitle}</div>
        <div className={classes.meta}>
          <span className={category.css}>{category.name}</span>
          {movie.year ? (
            <>
              <span className={classes.separator} aria-hidden="true">·</span>
              <span>{movie.year}</span>
            </>
          ) : null}
        </div>
        <div className={classes.meter} aria-hidden="true">
          {RATING_KEYS.map((key, segment) => (
            <i key={key} className={segment < litSegments ? classes.isOn : ''} />
          ))}
        </div>
        <div className={classes.ratings}>
          <span className={classes.average}>{ratingLabel(average)}</span>
          {last && last !== average ? (
            <span className={classes.last}>
              última
              {' '}
              <b className={classes[last]}>{RATING_LABELS[last]}</b>
            </span>
          ) : (
            <span className={classes.last}>{`${count} ${count === 1 ? 'avaliação' : 'avaliações'}`}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movie;
