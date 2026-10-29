import Image from 'next/image';
import { ratingLabel } from '@/lib/ratings';
import type { Category, MovieSummary } from '@/lib/types';
import classes from './style.module.scss';

const CATEGORIES: Record<Category, { name: string; css: string }> = {
  movie: { name: 'Filme', css: classes.movies },
  series: { name: 'Série', css: classes.series },
};

const Movie = ({ movie }: { movie: MovieSummary }) => {
  const category = CATEGORIES[movie.category];

  return (
    <div className={classes.movie}>
      {movie.posterUrl ? (
        <Image
          src={movie.posterUrl}
          alt=""
          fill
          sizes="(min-width: 768px) 260px, 50vw"
          className={classes.poster}
        />
      ) : <div className={classes.posterNotAvailable}>Imagem não disponível</div>}
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
