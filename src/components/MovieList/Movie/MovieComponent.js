import PropTypes from 'prop-types';
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

const MovieComponent = ({ movie }) => (
  <div className={classes.movie} style={{ backgroundImage: movie.poster_path ? `url(${movie.poster_path})` : null }}>
    {!movie.poster_path ? <div className={classes.posterNotAvailable}>Imagem não disponível</div> : null}
    <div className={classes.bottomBar} />
  </div>
);

MovieComponent.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MovieComponent;
