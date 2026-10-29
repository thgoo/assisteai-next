import type { RatingKey } from './types';

// Rating keys sent by the API, best first, with the labels shown to users
export const RATING_LABELS: Record<RatingKey, string> = {
  UNMISSABLE: 'Imperdível',
  VERY_GOOD: 'Muito Bom',
  GOOD: 'Bom',
  COOL: 'Legal',
  BAD: 'Ruinzinho',
  VERY_BAD: 'Muito Ruim',
  STAY_AWAY: 'Fique Longe',
};

export const ratingLabel = (key: RatingKey | null) => (key ? RATING_LABELS[key] : '-');
