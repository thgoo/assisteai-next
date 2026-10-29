// Server-side reads of movies
import { cacheLife, cacheTag } from 'next/cache';
import { ApiError, apiFetch } from './api';
import type { MovieDetail, MovieSummary, Page } from './types';

/** Cache tags, updated after a new rating (`src/app/actions.ts`) */
export const MOVIE_LIST_TAG = 'movies';
export const movieTag = (id: number) => `movie-${id}`;

/** The first page of the list: rendered on the home page and prerendered as movie pages at build time. */
export async function getLatestMovies() {
  'use cache';
  cacheLife('minutes');
  cacheTag(MOVIE_LIST_TAG);

  return apiFetch<Page<MovieSummary>>('/movies');
}

/** `null` when the API doesn't know the id. */
export async function getMovie(id: number) {
  'use cache';
  cacheLife({ revalidate: 300 });
  cacheTag(movieTag(id));

  try {
    return await apiFetch<MovieDetail>(`/movies/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** A new movie on every request. `null` when there is no eligible movie (404) or the API fails. */
export async function getRandomMovie() {
  try {
    return await apiFetch<MovieDetail>('/movies/random');
  } catch {
    return null;
  }
}

/** Movie URLs are `/movies/<id>-<slug>`; only the id matters. */
export function parseMovieId(param: string) {
  const id = Number(param.split('-', 1)[0]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
