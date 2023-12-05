import { useEffect } from 'react';
import MovieDetailsComponent from './MovieDetailsComponent';

const MovieDetailsContainer = ({ ...props }) => {
  useEffect(() => {
    document.documentElement.scrollTop = 0;
  }, []);

  return <MovieDetailsComponent {...props} />;
};

export default MovieDetailsContainer;
