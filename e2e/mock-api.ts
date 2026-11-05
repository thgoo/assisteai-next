// A stand-in for the API (../assisteai-api) with fixed data, so the e2e tests need no database.
// It follows the contract, ../docs/CONTRACTS.md: any difference is a mock bug.
import type {
  MovieDetail, MovieSummary, PublicUser, RatingKey, TitleResult, User,
} from '../src/lib/types';

const PORT = Number(process.env.MOCK_API_PORT || 3999);
let randomDraws = 0;
export const SESSION_COOKIE = 'session=e2e';

const PAGE_SIZE = 24;

const RATING_KEYS: RatingKey[] = ['STAY_AWAY', 'VERY_BAD', 'BAD', 'COOL', 'GOOD', 'VERY_GOOD', 'UNMISSABLE'];

// People who rated something; the e2e session is user 4
const ANA = 1;
const BRUNO = 2;
const CARLA = 3;
const ME = 4;
const people: PublicUser[] = [
  { id: ANA, name: 'Ana', avatarUrl: null, ratingCount: 0 },
  { id: BRUNO, name: 'Bruno', avatarUrl: null, ratingCount: 0 },
  { id: CARLA, name: 'Carla', avatarUrl: null, ratingCount: 0 },
  { id: ME, name: 'Usuário E2E', avatarUrl: null, ratingCount: 0 },
];

/** Who rated each movie: Ana and Bruno all of them, Carla every 5th, the signed-in user every 4th. */
const ratersOf = (id: number) => [ANA, BRUNO, ...(id % 5 === 0 ? [CARLA] : []), ...(id % 4 === 0 ? [ME] : [])];
people.forEach((person) => {
  person.ratingCount = Array.from({ length: 27 }, (_, i) => ratersOf(i + 1)).filter(r => r.includes(person.id)).length;
});

const RATER_RATINGS: Record<number, RatingKey> = {
  [ANA]: 'UNMISSABLE', [BRUNO]: 'GOOD', [CARLA]: 'COOL', [ME]: 'BAD',
};
/** What each person gave a movie: everyone panned the "Muito Ruim" ones (ids 25–27) */
const ratingOf = (rater: number, id: number): RatingKey => (id > 24 ? 'VERY_BAD' : RATER_RATINGS[rater]);

// 27 movies: a full first page (24) and a second, last page
const movies: MovieDetail[] = Array.from({ length: 27 }, (_, i) => {
  const id = i + 1;
  const raters = ratersOf(id);
  return {
    id,
    slug: `movie-${id}`,
    category: id % 3 === 0 ? 'series' : 'movie',
    // One accented title, for the accent-insensitive search
    title: id === 7 ? 'Ação em Dobro' : `Filme ${id}`,
    originalTitle: `Movie ${id}`,
    year: 2000 + id,
    // Only the second page has posters; e2e/posters.spec.ts serves them from the browser
    posterUrl: id > PAGE_SIZE ? `https://image.tmdb.org/t/p/w500/e2e-poster-${id}.jpg` : null,
    // The second page has backdrops too, at TMDb's paths (phones ask for a smaller size). Movie 1's is the home's
    // random backdrop: the only movie `GET /movies/random` can draw (the others with one are rated "Muito Ruim")
    backdropUrl: (id === 1 && `http://localhost:${PORT}/backdrop.png`)
      || (id > PAGE_SIZE ? `http://localhost:${PORT}/t/p/w1280/e2e-backdrop-${id}.png` : null),
    rating: {
      count: raters.length,
      average: (id <= 20 && 'VERY_GOOD') || (id <= 24 && 'COOL') || 'VERY_BAD',
      last: RATING_KEYS[id % RATING_KEYS.length],
    },
    genres: [id % 2 === 0 ? 'Drama' : 'Comedy', 'Sci-Fi & Fantasy'],
    description: `Description of movie ${id}.`,
    ratings: raters.map((rater, n) => ({
      id: id * 10 + n,
      rating: ratingOf(rater, id),
      comment: rater === BRUNO ? 'Bom demais' : null,
      createdAt: `2026-10-0${n + 1}T12:00:00.000Z`,
      user: { id: rater, name: people.find(p => p.id === rater)!.name, avatarUrl: null },
    })),
  };
});

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const SORTS = ['recent', 'rating', 'popular'] as const;
type Sort = typeof SORTS[number];

interface ListQuery {
  q: string;
  category: string | null;
  genre: string | null;
  averages: string[];
  ratedBy: number | null;
  unratedByMe: boolean;
  sort: Sort;
  /** Where the page starts */
  offset: number;
}

// The mock's cursors are opaque like the API's (base64url JSON) and carry their sort; inside, an offset
const encodeCursor = (sort: Sort, offset: number) => Buffer.from(JSON.stringify({ sort, offset })).toString('base64url');

function decodeCursor(cursor: string): { sort: unknown; offset: unknown } | null {
  try {
    const key = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return key && typeof key === 'object' ? key : null;
  } catch {
    return null;
  }
}

/**
 * `GET /movies`' query, validated like the API (docs/CONTRACTS.md, "Movie list filters"): the problem's `detail` for
 * an invalid one. Unknown params are ignored.
 */
function parseListQuery(params: URLSearchParams): ListQuery | string {
  const INVALID = 'Filtro inválido.';
  const q = params.get('q')?.trim() ?? '';
  if (q.length > 100) return INVALID;
  const category = params.get('category');
  if (category !== null && category !== 'movie' && category !== 'series') return INVALID;
  const genre = params.get('genre')?.trim() ?? null;
  if (genre !== null && (genre.length < 1 || genre.length > 100)) return INVALID;
  const average = params.get('average');
  const averages = average?.trim() ? [...new Set(average.split(',').map(key => key.trim()))] : [];
  if (averages.some(key => !RATING_KEYS.includes(key as RatingKey))) return INVALID;
  const ratedBy = params.get('ratedBy');
  if (ratedBy !== null && !/^[1-9][0-9]{0,14}$/.test(ratedBy)) return INVALID;
  const unratedByMe = params.get('unratedByMe');
  if (unratedByMe !== null && unratedByMe !== 'true') return INVALID;
  const sort = params.get('sort') ?? 'recent';
  if (!SORTS.includes(sort as Sort)) return INVALID;

  let offset = 0;
  const cursor = params.get('cursor');
  if (cursor !== null) {
    const key = decodeCursor(cursor);
    if (key?.sort !== sort || !Number.isSafeInteger(key.offset) || (key.offset as number) <= 0) return 'Cursor inválido.';
    offset = key.offset as number;
  }

  return {
    q: fold(q),
    category,
    genre,
    averages,
    ratedBy: ratedBy === null ? null : Number(ratedBy),
    unratedByMe: unratedByMe === 'true',
    sort: sort as Sort,
    offset,
  };
}

/** `GET /movies`' filters and sorts (the API's contract, on the fixtures) */
function listMovies(query: ListQuery): MovieDetail[] {
  const {
    q, category, genre, averages, ratedBy, unratedByMe, sort,
  } = query;
  const found = movies.filter(movie => (
    movie.ratings.length > 0
    && (!q || fold(`${movie.title} ${movie.originalTitle}`).includes(q))
    && (!category || movie.category === category)
    && (!genre || movie.genres.includes(genre))
    && (!averages.length || averages.includes(movie.rating.average!))
    && (!ratedBy || ratersOf(movie.id).includes(ratedBy))
    && (!unratedByMe || !ratersOf(movie.id).includes(ME))
  ));

  if (sort === 'rating') {
    found.sort((a, b) => RATING_KEYS.indexOf(b.rating.average!) - RATING_KEYS.indexOf(a.rating.average!)
      || b.rating.count - a.rating.count || b.id - a.id);
  } else if (sort === 'popular') {
    found.sort((a, b) => b.rating.count - a.rating.count || b.id - a.id);
  }
  return found;
}

// What `GET /titles/search` finds (TMDb's search, in the API)
const titles: TitleResult[] = [
  {
    url: 'https://www.themoviedb.org/movie/603',
    category: 'movie',
    title: 'Matrix',
    originalTitle: 'The Matrix',
    year: 1999,
    posterUrl: null,
    ratedByMe: false,
  },
  {
    url: 'https://www.themoviedb.org/movie/604',
    category: 'movie',
    title: 'Matrix Reloaded',
    originalTitle: 'The Matrix Reloaded',
    year: 2003,
    posterUrl: null,
    ratedByMe: true,
  },
  {
    url: 'https://www.themoviedb.org/tv/1399',
    category: 'series',
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    year: 2011,
    posterUrl: null,
    ratedByMe: false,
  },
];

const user: User = {
  id: ME, name: 'Usuário E2E', email: 'e2e@example.com', avatarUrl: null,
};

const summary = (movie: MovieDetail): MovieSummary => ({
  id: movie.id,
  slug: movie.slug,
  category: movie.category,
  title: movie.title,
  originalTitle: movie.originalTitle,
  year: movie.year,
  posterUrl: movie.posterUrl,
  rating: movie.rating,
});


function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') ?? '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

const json = (req: Request, body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders(req) });

const problem = (req: Request, status: number, detail?: string) => new Response(
  JSON.stringify({
    type: 'about:blank', title: 'Error', status, ...(detail ? { detail } : {}),
  }),
  { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/problem+json' } },
);

/** Ratings that make a movie worth suggesting on the home page (`GET /movies/random`) */
const RECOMMENDED_RATINGS: RatingKey[] = ['COOL', 'GOOD', 'VERY_GOOD', 'UNMISSABLE'];

// Reserved TMDb ids / IMDb ids (mock only) for `POST /ratings`' TMDb outcomes when resolving a link:
// TMDb `/movie/404404` or IMDb `tt0404404`: TMDb doesn't know the title → 404
// TMDb `/movie/502502` or IMDb `tt0502502`: TMDb can't be reached → 502
const TMDB_UNKNOWN = { tmdbId: '404404', imdbId: 'tt0404404' };
const TMDB_DOWN = { tmdbId: '502502', imdbId: 'tt0502502' };

type TitleLink = { imdbId: string } | { tmdbId: string };

/** The IMDb or TMDb title a `POST /ratings` link points to, or null (the API's rules) */
function parseTitleLink(value: string): TitleLink | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (['imdb.com', 'www.imdb.com', 'm.imdb.com'].includes(url.hostname)) {
    const imdbId = /^\/(?:[a-z]{2}\/)?title\/(tt\d{7,10})(?:\/|$)/.exec(url.pathname)?.[1];
    return imdbId ? { imdbId } : null;
  }
  if (['themoviedb.org', 'www.themoviedb.org'].includes(url.hostname)) {
    const tmdbId = /^\/(?:movie|tv)\/(\d{1,10})(?:-[^/]*)?(?:\/|$)/.exec(url.pathname)?.[1];
    return tmdbId ? { tmdbId } : null;
  }
  return null;
}

const isLinkTo = (link: TitleLink, ids: { tmdbId: string; imdbId: string }) => (
  'imdbId' in link ? link.imdbId === ids.imdbId : link.tmdbId === ids.tmdbId
);

const signedIn = (req: Request) => (req.headers.get('Cookie') ?? '').split('; ').includes(SESSION_COOKIE);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const route = `${req.method} ${url.pathname}`;

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });

    if (route === 'GET /movies') {
      const query = parseListQuery(url.searchParams);
      if (typeof query === 'string') return problem(req, 422, query);
      if (query.unratedByMe && !signedIn(req)) return problem(req, 401, 'Faça login para continuar.');
      const found = listMovies(query);
      const end = query.offset + PAGE_SIZE;
      return json(req, {
        data: found.slice(query.offset, end).map(summary),
        nextCursor: end < found.length ? encodeCursor(query.sort, end) : null,
      });
    }

    if (route === 'GET /genres') {
      // Of rated movies only, like the list
      const rated = movies.filter(movie => movie.ratings.length > 0);
      const names = [...new Set(rated.flatMap(movie => movie.genres))].sort();
      return json(req, { data: names.map(name => ({ name, count: rated.filter(m => m.genres.includes(name)).length })) });
    }

    if (route === 'GET /users') return json(req, { data: people });

    // A movie with a backdrop and a COOL-or-better rating, like production (the backdrop takes space above the list,
    // which scroll restoration depends on). The fixtures have one: each draw marks its backdrop's URL, so every call
    // tells apart like production's new draw
    if (route === 'GET /movies/random') {
      const candidates = movies.filter(movie => movie.backdropUrl !== null
        && movie.ratings.some(rating => RECOMMENDED_RATINGS.includes(rating.rating)));
      if (!candidates.length) return problem(req, 404, 'Nenhum filme para sugerir ainda.');
      const movie = candidates[Math.floor(Math.random() * candidates.length)];
      randomDraws += 1;
      return json(req, { ...movie, backdropUrl: `${movie.backdropUrl}?draw=${randomDraws}` });
    }

    if (route === 'GET /backdrop.png' || /^GET \/t\/p\/w\d+\/e2e-backdrop-\d+\.png$/.test(route)) {
      return new Response(Bun.file(new URL('../public/img/logo-square.png', import.meta.url)));
    }

    const movieMatch = route.match(/^GET \/movies\/(\d+)$/);
    if (movieMatch) {
      const movie = movies.find(m => m.id === Number(movieMatch[1]));
      return movie ? json(req, movie) : problem(req, 404);
    }

    if (route === 'GET /me') return signedIn(req) ? json(req, { user }) : problem(req, 401, 'Faça login para continuar.');

    if (route === 'GET /titles/search') {
      if (!signedIn(req)) return problem(req, 401, 'Faça login para continuar.');
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
      if (q.length < 2) return problem(req, 422, 'Digite pelo menos 2 letras.');
      const found = titles.filter(t => `${t.title} ${t.originalTitle}`.toLowerCase().includes(q));
      return json(req, { data: found });
    }

    if (route === 'POST /auth/logout') return new Response(null, { status: 204, headers: corsHeaders(req) });

    if (route === 'POST /ratings') {
      if (!signedIn(req)) return problem(req, 401, 'Faça login para continuar.');
      const body = (await req.json()) as { url?: string; movieId?: number };
      if ((body.url === undefined) === (body.movieId === undefined)) return problem(req, 422, 'Informe o título.');
      if (body.movieId !== undefined) {
        // A movie of the site's own
        const movie = movies.find(m => m.id === body.movieId);
        if (!movie) return problem(req, 404, 'Título não encontrado.');
        if (movie.ratings.some(r => r.user.id === ME)) return problem(req, 409, 'Você já avaliou esse filme.');
        return json(req, { movie: { id: movie.id, slug: movie.slug } }, 201);
      }
      const link = typeof body.url === 'string' ? body.url.trim() : '';
      if (!link) return problem(req, 422, 'Informe o link do IMDb ou do TMDb.');
      const title = parseTitleLink(link);
      if (!title) return problem(req, 422, 'Link do IMDb ou do TMDb inválido.');
      if (isLinkTo(title, TMDB_UNKNOWN)) return problem(req, 404, 'Não encontramos esse título no TMDb.');
      if (isLinkTo(title, TMDB_DOWN)) return problem(req, 502, 'Não foi possível falar com o TMDb agora. Tente de novo.');
      return json(req, { movie: { id: 1, slug: 'movie-1' } }, 201);
    }

    if (route === 'GET /health') return json(req, { status: 'ok' });

    return problem(req, 404);
  },
});

console.log(`Mock API on http://localhost:${PORT}`);
