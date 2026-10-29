// Shapes of the API (../assisteai-back/docs/rewrite/05-api-design.md)

export type RatingKey = 'STAY_AWAY' | 'VERY_BAD' | 'BAD' | 'COOL' | 'GOOD' | 'VERY_GOOD' | 'UNMISSABLE';

export type Category = 'movie' | 'series';

export interface RatingSummary {
  count: number;
  average: RatingKey | null;
  last: RatingKey | null;
}

export interface MovieSummary {
  id: number;
  slug: string;
  category: Category;
  title: string;
  originalTitle: string;
  year: number | null;
  posterUrl: string | null;
  rating: RatingSummary;
}

export interface Rating {
  id: number;
  rating: RatingKey;
  comment: string | null;
  createdAt: string;
  user: { name: string; avatarUrl: string | null };
}

export interface MovieDetail extends MovieSummary {
  genres: string[];
  description: string | null;
  backdropUrl: string | null;
  ratings: Rating[];
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string | null;
}
