import PropTypes from 'prop-types';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlus, faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import classes from './style.module.scss';

const parseCategory = (category) => {
  const map = {
    MOVIE: {
      name: 'Filme',
      css: classes.movies,
    },
    SERIE: {
      name: 'Série',
      css: classes.series,
    },
  };

  return map[category];
};

const MovieComponent = ({ movie }) => (
  <>
    <div className={classes.movie} style={{ backgroundImage: movie.poster_path ? `url(${movie.poster_path})` : null }}>
      {!movie.poster_path ? <div className={classes.posterNotAvailable}>Imagem não disponível</div> : null}
      <div className={classes.overlayCard}>
        <div className={classes.movieCardInfo}>
          <span className={`${classes.category} ${parseCategory(movie.category)?.css}`}>
            {parseCategory(movie.category)?.name}
          </span>
          <div className={classes.ratingContainer}>
            <div>
              <span className={classes.rating}>{movie.average_rating}</span>
              Média
            </div>
            <div>
              <span className={classes.rating}>{movie.last_rating}</span>
              Última
            </div>
          </div>
          <div className={classes.actionsContainer}>
            <hr />
            <FontAwesomeIcon icon={faClock} className={classes.pinkColor} data-tip data-for="watch-later" />
            <FontAwesomeIcon icon={faPlus} className={classes.greenColor} data-tip data-for="indicate" />
            <Link href="/movies/[movieId]" as={`/movies/${movie.id}-${movie.slug}`}>
              <a><FontAwesomeIcon icon={faArrowRight} className={classes.blueColor} data-tip data-for="view-more" /></a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </>
);

MovieComponent.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MovieComponent;
