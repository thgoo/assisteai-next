import { useCallback, useState } from 'react';
import Image from 'next/image';
import { ratingLabel } from '@/lib/ratings';
import PosterTransition from '../../PosterTransition/PosterTransition';
import type { Category, MovieSummary } from '@/lib/types';
import { POSTER_SIZES } from './posters';
import classes from './style.module.scss';

const CATEGORIES: Record<Category, { name: string; css: string }> = {
  movie: { name: 'Filme', css: classes.movies },
  series: { name: 'Série', css: classes.series },
};

type PosterStatus = 'loading' | 'loaded' | 'failed';

interface MovieProps {
  movie: MovieSummary;
  /** Clicked: its rating overlay hides, so it doesn't fly to the movie page with the card */
  isOpening?: boolean;
  /** Called once the poster has loaded or failed */
  onPosterSettled?: () => void;
}

const Movie = ({ movie, isOpening = false, onPosterSettled }: MovieProps) => {
  const category = CATEGORIES[movie.category];
  const [posterStatus, setPosterStatus] = useState<PosterStatus>(movie.posterUrl ? 'loading' : 'failed');
  const [cached, setCached] = useState(false);

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

  return (
    // The same name as the movie page's poster: navigating between them, the card (frame and poster) flies from one
    // place to the other
    <PosterTransition id={movie.id}>
      <div
        className={`${classes.movie} ${posterStatus === 'loading' ? classes.isLoading : ''} ${
          cached ? classes.isCached : ''} ${isOpening ? classes.isOpening : ''}`}
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
            className={`${classes.poster} ${posterStatus === 'loaded' ? classes.isLoaded : ''} ${cached ? classes.isCached : ''}`}
            onLoad={() => settlePoster('loaded')}
            onError={() => settlePoster('failed')}
          />
        ) : null}
        {posterStatus === 'failed' ? <div className={classes.posterNotAvailable}>Imagem não disponível</div> : null}
        <div className={classes.overlayCard}>
          <div className={classes.movieCardInfo}>
            <span className={`${classes.category} ${category.css}`}>
              {category.name}
            </span>
            <div className={classes.ratingContainer}>
              <div>
                <span className={classes.rating}>{ratingLabel(movie.rating.average)}</span>
                Média
              </div>
              <div>
                <span className={classes.rating}>{ratingLabel(movie.rating.last)}</span>
                Última
              </div>
            </div>
          </div>
        </div>
      </div>
    </PosterTransition>
  );
};

export default Movie;
