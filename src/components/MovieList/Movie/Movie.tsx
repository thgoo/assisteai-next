import { useState } from 'react';
import Image from 'next/image';
import { ratingLabel } from '@/lib/ratings';
import type { Category, MovieSummary } from '@/lib/types';
import classes from './style.module.scss';

const CATEGORIES: Record<Category, { name: string; css: string }> = {
  movie: { name: 'Filme', css: classes.movies },
  series: { name: 'Série', css: classes.series },
};

type PosterStatus = 'loading' | 'loaded' | 'failed';

interface MovieProps {
  movie: MovieSummary;
  /** Called once the poster has loaded or failed */
  onPosterSettled?: () => void;
}

const Movie = ({ movie, onPosterSettled }: MovieProps) => {
  const category = CATEGORIES[movie.category];
  const [posterStatus, setPosterStatus] = useState<PosterStatus>(movie.posterUrl ? 'loading' : 'failed');

  const settlePoster = (status: PosterStatus) => {
    setPosterStatus(status);
    onPosterSettled?.();
  };

  return (
    <div className={`${classes.movie} ${posterStatus === 'loading' ? classes.isLoading : ''}`}>
      {movie.posterUrl && posterStatus !== 'failed' ? (
        <Image
          src={movie.posterUrl}
          alt=""
          fill
          sizes="(min-width: 768px) 260px, 50vw"
          // Hidden pages of the list wait for their posters, which lazy images would never start
          loading="eager"
          className={`${classes.poster} ${posterStatus === 'loaded' ? classes.isLoaded : ''}`}
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
  );
};

export default Movie;
