import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useSWRInfinite } from 'swr';

const MovieListContext = createContext({});
const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.next_page_url) return null; // reached the end

  return `/movies?page=${pageIndex + 1}`; // SWR key
};

export default function MovieListProvider({ children }) {
  const {
    data, mutate, size, setSize, isValidating,
  } = useSWRInfinite(getKey);

  return (
    <MovieListContext.Provider
      value={{
        movies: data,
        isValidating,
        nextPage: () => setSize(size + 1),
        refresh: mutate,
      }}
    >
      {children}
    </MovieListContext.Provider>
  );
}

MovieListProvider.propTypes = {
  children: PropTypes.node,
};

MovieListProvider.defaultProps = {
  children: null,
};

export const useMovieList = () => useContext(MovieListContext);
