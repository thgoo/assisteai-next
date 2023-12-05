import { useEffect } from 'react';
import MovieDetailsComponent from './MovieDetailsComponent';

const MovieDetailsContainer = ({ ...props }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <MovieDetailsComponent {...props} />;
};

export default MovieDetailsContainer;
