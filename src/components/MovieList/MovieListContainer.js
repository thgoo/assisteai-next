import { debounce } from 'lodash';
import { useEffect } from 'react';
import MovieListComponent from './MovieListComponent';
import { useMovieList } from './MovieListContext';

let busy;
const MovieListContainer = () => {
  const { movies, nextPage, isValidating } = useMovieList();

  useEffect(() => {
    busy = isValidating;
  }, [isValidating]);

  useEffect(() => {
    const scrollPosition = window.sessionStorage.getItem('scrollPosition');
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 300// document.documentElement.scrollTop * 0.1
        >= document.documentElement.offsetHeight
      ) {
        if (!busy) nextPage();
      }
      window.sessionStorage.setItem('scrollPosition', document.documentElement.scrollTop);
    };

    // samePage();
    window.addEventListener('scroll', handleScroll);
    if (scrollPosition) {
      document.documentElement.scrollTop = scrollPosition;
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextPage]);

  return <MovieListComponent isLoading={isValidating} data={movies} />;
};

export default MovieListContainer;
