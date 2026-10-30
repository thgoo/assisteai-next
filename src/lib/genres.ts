// The API stores TMDb's genre names in English; the front shows them in Portuguese, like the rating labels
const GENRE_LABELS: Record<string, string> = {
  'Action': 'Ação',
  'Action & Adventure': 'Ação e Aventura',
  'Adventure': 'Aventura',
  'Animation': 'Animação',
  'Comedy': 'Comédia',
  'Crime': 'Crime',
  'Documentary': 'Documentário',
  'Drama': 'Drama',
  'Family': 'Família',
  'Fantasy': 'Fantasia',
  // Retired by TMDb, still on old titles
  'Foreign': 'Estrangeiro',
  'History': 'História',
  'Horror': 'Terror',
  'Kids': 'Infantil',
  'Music': 'Música',
  'Mystery': 'Mistério',
  'News': 'Notícias',
  'Reality': 'Reality',
  'Romance': 'Romance',
  'Sci-Fi & Fantasy': 'Ficção científica e Fantasia',
  'Science Fiction': 'Ficção científica',
  'Soap': 'Novela',
  'Talk': 'Talk show',
  'Thriller': 'Suspense',
  'TV Movie': 'Filme para TV',
  'War': 'Guerra',
  'War & Politics': 'Guerra e Política',
  'Western': 'Faroeste',
};

/** Unknown names (TMDb may add genres) show as they are. */
export const genreLabel = (name: string) => GENRE_LABELS[name] ?? name;
