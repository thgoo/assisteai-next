import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MovieDetails from '@/components/MovieDetails/MovieDetails';
import { getLatestMovies, getMovie, parseMovieId } from '@/lib/movies';

// Movies outside the build are generated on their first visit, which waits for them: so an unknown id answers a real 404
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const { data: movies } = await getLatestMovies();

  // Cache Components needs at least one; with no movies yet, an id that answers 404 without calling the API
  if (movies.length === 0) return [{ movieId: '0' }];

  return movies.map(movie => ({ movieId: `${movie.id}-${movie.slug}` }));
}

async function findMovie(param: string) {
  const id = parseMovieId(param);
  return id === null ? null : getMovie(id);
}

export async function generateMetadata({ params }: PageProps<'/movies/[movieId]'>): Promise<Metadata> {
  const movie = await findMovie((await params).movieId);

  return { title: movie ? `Assiste Aí - ${movie.originalTitle}` : 'Assiste Aí' };
}

export default async function MoviePage({ params }: PageProps<'/movies/[movieId]'>) {
  const movie = await findMovie((await params).movieId);
  if (!movie) notFound();

  return <MovieDetails movie={movie} />;
}
