import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { API_URL } from '../../../config';
import MovieListComponent from './MovieListComponent';

const scrollOffset = 150; // in pixels
let blockLoadMore = false;
const MovieListContainer = ({ firstMovies, ...props }) => {
  const [movies, setMovies] = useState([...firstMovies]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const handleClick = (movie) => {
    window.history.pushState(null, null, `/movies/${movie.id}-${movie.slug}`);
  };

  useEffect(() => {
    if (page === 1) return;

    const loadMovies = async () => {
      try {
        setIsLoading(true);
        blockLoadMore = true;
        const res = await fetch(`${API_URL}/movies?page=${page}`);
        const { data } = await res.json();
        setMovies(oldMovies => [...oldMovies, ...data]);
      } catch {
        // handle error
      } finally {
        blockLoadMore = false;
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - scrollOffset
      ) {
        console.log('blockLoadMore', blockLoadMore);
        if (!blockLoadMore) setPage(oldPage => oldPage + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <MovieListComponent isLoading={isLoading} movies={movies} onClick={handleClick} router={router} {...props} />;
};

MovieListContainer.propTypes = {
  firstMovies: PropTypes.array.isRequired,
};

export default MovieListContainer;
