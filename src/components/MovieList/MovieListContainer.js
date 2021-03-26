import { debounce } from 'lodash';
import { useEffect } from 'react';
import { useSWRInfinite } from 'swr';
import MovieListComponent from './MovieListComponent';

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.next_page_url) return null; // reached the end

  return `/movies?page=${pageIndex + 1}`; // SWR key
};

let busy;
const MovieListContainer = () => {
  const {
    data, setSize, isValidating,
  } = useSWRInfinite(getKey);

  useEffect(() => {
    busy = isValidating;
  }, [isValidating]);

  useEffect(() => {
    const scrollPosition = window.sessionStorage.getItem('scrollPosition');
    const handleScroll = debounce(() => {
      if (
        (
          window.innerHeight
          + document.documentElement.scrollTop
          + (document.documentElement.scrollTop * 0.1)
        ) >= document.documentElement.offsetHeight
      ) {
        if (!busy) setSize(oldSize => oldSize + 1);
      }
      window.sessionStorage.setItem('scrollPosition', document.documentElement.scrollTop);
    }, 100);

    setSize(oldSize => oldSize);
    window.addEventListener('scroll', handleScroll);
    if (scrollPosition) {
      document.documentElement.scrollTop = scrollPosition;
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setSize]);

  return (
    <MovieListComponent
      isLoading={isValidating}
      data={data}
    />
  );
};

export default MovieListContainer;
