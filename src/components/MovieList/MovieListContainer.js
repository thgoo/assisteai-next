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

  // load next page
  useEffect(() => {
    const scrollPosition = window.sessionStorage.getItem('scrollPosition');
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 360
        >= document.documentElement.offsetHeight
      ) {
        if (!busy) nextPage();
      }
    };

    // samePage();
    window.addEventListener('scroll', handleScroll);
    if (scrollPosition) {
      document.documentElement.scrollTop = scrollPosition;
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextPage]);

  // save scroll position
  useEffect(() => {
    const debouncedSaveScrollPosition = debounce(() => {
      window.sessionStorage.setItem('scrollPosition', document.documentElement.scrollTop);
    }, 20);

    window.addEventListener('scroll', debouncedSaveScrollPosition);
    return () => window.removeEventListener('scroll', debouncedSaveScrollPosition);
  }, []);

  return <MovieListComponent isLoading={isValidating} data={movies} />;
};

export default MovieListContainer;
