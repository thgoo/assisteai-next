import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faStarHalf } from '@fortawesome/pro-regular-svg-icons';
import { faPlus } from '@fortawesome/pro-light-svg-icons';
import classes from './style.module.scss';

const parseRating = (rating) => {
  const map = {
    STAY_AWAY: 'is0',
    VERY_BAD: 'is1',
    BAD: 'is2',
    COOL: 'is3',
    GOOD: 'is4',
    VERY_GOOD: 'is5',
    UNMISSABLE: 'is6',
  };

  return map[rating];
};

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
          <h2 className={classes.title}>{movie.title || movie.original_title}</h2>
          <span className={`${classes.category} ${parseCategory(movie.category)?.css}`}>
            {parseCategory(movie.category)?.name}
          </span>
          <div className={classes.ratingContainer}>
            Média
            <span className={classes.rating}>{movie.average_rating}</span>
          </div>
          <div className={classes.ratingContainer}>
            Última
            <span className={classes.rating}>{movie.last_rating}</span>
          </div>
          <div className={classes.ratingContainerTotal}>
            <FontAwesomeIcon icon={faStarHalf} />
            {movie.rating_count}
          </div>
          <div className={classes.actionsContainer}>
            <hr />
            <FontAwesomeIcon icon={faClock} />
            <FontAwesomeIcon icon={faPlus} />
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
