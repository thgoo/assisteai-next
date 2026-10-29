import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ratingLabel } from '../../../constants/ratings';
import classes from './style.module.scss';

const parseCategory = (category) => {
  const map = {
    movie: {
      name: 'Filme',
      css: classes.movies,
    },
    series: {
      name: 'Série',
      css: classes.series,
    },
  };

  return map[category] || '';
};

const addWatchLater = (e) => {
  e.preventDefault();
};

const addIndication = (e) => {
  e.preventDefault();
};

const MovieComponent = ({ movie }) => (
  <>
    <div className={classes.movie} style={{ backgroundImage: movie.posterUrl ? `url(${movie.posterUrl})` : null }}>
      {!movie.posterUrl ? <div className={classes.posterNotAvailable}>Imagem não disponível</div> : null}
      <div className={classes.overlayCard}>
        <div className={classes.movieCardInfo}>
          <span className={`${classes.category} ${parseCategory(movie.category)?.css}`}>
            {parseCategory(movie.category)?.name}
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
          <div className={classes.actionsContainer}>
            <hr />
            <button type="button" className={classes.buttonIcon} onClick={e => addIndication(e)}>
              <FontAwesomeIcon icon={faClock} className={classes.pinkColor} data-tip data-for="watch-later" />
            </button>
            <button type="button" className={classes.buttonIcon} onClick={e => addWatchLater(e)}>
              <FontAwesomeIcon icon={faPlus} className={classes.greenColor} data-tip data-for="indicate" />
            </button>
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
