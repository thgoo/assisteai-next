import PropTypes from 'prop-types';
import Link from 'next/link';
import Spinner from '../Spinner';
import Movie from './Movie';
import classes from './style.module.scss';

const MovieListComponent = ({ isLoading, movies, onClick, router }) => (
  <div className={classes.movieList}>
    {movies.map(movie => (
      <div className={classes.gridItem} key={movie.id}>
        <Link href="/movies/[movieId]" as={`/movies/${movie.id}-${movie.slug}`}>
        {/* <Link href={`${router.pathname}?movieId=${movie.id}`} as={`/movies/${movie.id}-${movie.slug}`} shallow scroll={false}> */}
        {/* <a className={classes.itemWrapper}><Movie movie={movie} /></a> */}
          <button type="button" onClick={() => onClick(movie)}>
            <a className={classes.itemWrapper}><Movie movie={movie} /></a>
          </button>
        </Link>
      </div>
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

MovieListComponent.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  movies: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
};

export default MovieListComponent;
