import PropTypes from 'prop-types';
import classes from './style.module.scss';

const GenresComponent = ({ genres }) => (
  <div className={classes.genres}>
    {genres.split(',').map(genre => (
      <span key={genre}>{genre}</span>
    ))}
  </div>
);

GenresComponent.propTypes = {
  genres: PropTypes.string.isRequired,
};

export default GenresComponent;
