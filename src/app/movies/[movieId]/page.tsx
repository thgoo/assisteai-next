import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MovieDetails from '@/components/MovieDetails/MovieDetails';
import { getLatestMovies, getMovie, parseMovieId } from '@/lib/movies';
import { ratingLabel } from '@/lib/ratings';
import type { MovieDetail } from '@/lib/types';

// Movies outside the build are generated on their first visit, which waits for them: so an unknown id answers a real 404
export const ensureStatic = 'navigation';
// The page waits for its movie on purpose, rather than a loading fallback: rendering it in the navigation's commit is
// what lets the poster fly from its list card (<ViewTransition>), and the static output keeps that wait short
export const instant = false;

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

/** "Média Muito Bom · 4 avaliações" */
const ratingSummary = ({ rating }: MovieDetail) => (
  `Média ${ratingLabel(rating.average)} · ${rating.count} ${rating.count === 1 ? 'avaliação' : 'avaliações'}`
);

export async function generateMetadata({ params }: PageProps<'/movies/[movieId]'>): Promise<Metadata> {
  const movie = await findMovie((await params).movieId);
  if (!movie) return { title: 'Assiste Aí' };

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const description = [ratingSummary(movie), movie.description].filter(Boolean).join(' — ');
  // The backdrop fills the large preview; the poster is the fallback
  const image = movie.backdropUrl ?? movie.posterUrl;

  return {
    title: `Assiste Aí - ${movie.originalTitle}`,
    description,
    openGraph: {
      siteName: 'Assiste Aí',
      title,
      description,
      locale: 'pt_BR',
      type: 'video.movie',
      url: `/movies/${movie.id}-${movie.slug}`,
      images: image ? [image] : ['/img/logo-square.png'],
    },
    twitter: { card: movie.backdropUrl ? 'summary_large_image' : 'summary' },
  };
}

export default async function MoviePage({ params }: PageProps<'/movies/[movieId]'>) {
  const movie = await findMovie((await params).movieId);
  if (!movie) notFound();

  return <MovieDetails movie={movie} />;
}
