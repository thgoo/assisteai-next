'use server';

import { updateTag } from 'next/cache';
import { MOVIE_LIST_TAG, movieTag } from '@/lib/movies';

/** After a new rating: the next visit to the list and to the movie's page shows it. */
export async function refreshMovieCaches(movieId: number) {
  if (!Number.isSafeInteger(movieId) || movieId <= 0) return;

  updateTag(MOVIE_LIST_TAG);
  updateTag(movieTag(movieId));
}
