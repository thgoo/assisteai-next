import PropTypes from 'prop-types';
import Link from 'next/link';
import Spinner from '../Spinner';
import Movie from './Movie';
import classes from './style.module.scss';

const MovieListComponent = ({ isLoading, data }) => {
  if (!data) {
    return <div>Nenhum filme indicado.</div>;
  }

  return (
    <div className={classes.movieList}>
      {data.map(movies => (
        movies.data.map(movie => (
          <div className={classes.gridItem} key={movie.id}>
            <Link href="/movies/[movieId]" as={`/movies/${movie.id}-${movie.slug}`}>
              <a className={classes.itemWrapper}><Movie movie={movie} /></a>
            </Link>
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
