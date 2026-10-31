import { Suspense } from 'react';
import { BackdropPlaceholder } from '@/components/Backdrop/Backdrop';
import SessionBackdrop from '@/components/Backdrop/SessionBackdrop';
import MovieFilters from '@/components/MovieFilters/MovieFilters';
import MovieList from '@/components/MovieList/MovieList';
import MovieListProvider from '@/components/MovieList/MovieListProvider';
import { getLatestMovies, getRandomMovie } from '@/lib/movies';

// A different backdrop on every visit (SessionBackdrop keeps it while navigating), streamed into the static shell
async function RandomBackdrop() {
  const movie = await getRandomMovie();

  return <SessionBackdrop backdrop={movie?.backdropUrl ?? null} />;
}

export default async function HomePage() {
  const firstPage = await getLatestMovies();

  return (
    <MovieListProvider firstPage={firstPage}>
      <div className="container">
        <div className="backdrop-wrapper">
          <Suspense fallback={<BackdropPlaceholder />}>
            <RandomBackdrop />
          </Suspense>
        </div>
        <div className="actions-wrapper">
          <MovieFilters />
        </div>
        <div className="movie-list-wrapper">
          <MovieList />
        </div>
      </div>
    </MovieListProvider>
  );
}
