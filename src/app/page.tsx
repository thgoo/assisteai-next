import { Suspense } from 'react';
import Backdrop, { BackdropPlaceholder } from '@/components/Backdrop/Backdrop';
import MovieFilters from '@/components/MovieFilters/MovieFilters';
import MovieList from '@/components/MovieList/MovieList';
import MovieListProvider from '@/components/MovieList/MovieListProvider';
import NewThread from '@/components/NewThread/NewThread';
import { getLatestMovies, getRandomMovie } from '@/lib/movies';

// A different backdrop on every visit, streamed into the static shell
async function RandomBackdrop() {
  const movie = await getRandomMovie();

  return <Backdrop backdrop={movie?.backdropUrl ?? null} colorless />;
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
          <MovieFilters action={<NewThread />} />
        </div>
        <div className="movie-list-wrapper">
          <MovieList />
        </div>
      </div>
    </MovieListProvider>
  );
}
