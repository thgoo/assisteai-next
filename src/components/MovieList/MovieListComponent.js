import PropTypes from 'prop-types';
import Spinner from '../Spinner';
import Movie from './Movie';
import classes from './style.module.scss';

const MovieListComponent = ({ isLoading, data }) => {
  if (!data) {
    if (isLoading) return <div className={`${classes.listText} magic-border light`}>Carregando...</div>;
    return <div className={`${classes.listText} magic-border light`}>Nenhum filme indicado.</div>;
  }

  return (
    <div className={classes.movieList}>
      {data.map(movies => (
        movies.data.map(movie => (
          <div className={classes.gridItem} key={movie.id}>
            <div className={classes.itemWrapper}><Movie movie={movie} /></div>
          </div>
        ))
      ))}
      {isLoading ? (
        <div className={classes.gridItem}>
          <div className={`${classes.itemWrapper} ${classes.isSpinner}`}>
            <Spinner />
          </div>
        </div>
      ) : null}
    </div>
  );
};

MovieListComponent.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  data: PropTypes.array,
};

MovieListComponent.defaultProps = {
  data: null,
};

export default MovieListComponent;
