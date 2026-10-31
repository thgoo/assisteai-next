// A stand-in for the API (../assisteai-api) with fixed data, so the e2e tests need no database.
// The shapes follow ../assisteai-back/docs/rewrite/05-api-design.md.
import type {
  MovieDetail, MovieSummary, PublicUser, RatingKey, TitleResult, User,
} from '../src/lib/types';

const PORT = Number(process.env.MOCK_API_PORT || 3999);
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
    // The second page has backdrops too, at TMDb's paths (phones ask for a smaller size)
    backdropUrl: id > PAGE_SIZE ? `http://localhost:${PORT}/t/p/w1280/e2e-backdrop-${id}.png` : null,
    rating: {
      count: raters.length,
      average: (id <= 20 && 'VERY_GOOD') || (id <= 24 && 'COOL') || 'VERY_BAD',
      last: RATING_KEYS[id % RATING_KEYS.length],
    },
    genres: [id % 2 === 0 ? 'Drama' : 'Comedy', 'Sci-Fi & Fantasy'],
    description: `Description of movie ${id}.`,
    ratings: raters.map((rater, n) => ({
      id: id * 10 + n,
      rating: RATER_RATINGS[rater],
      comment: rater === BRUNO ? 'Bom demais' : null,
      createdAt: `2026-10-0${n + 1}T12:00:00.000Z`,
      user: { id: rater, name: people.find(p => p.id === rater)!.name, avatarUrl: null },
    })),
  };
});

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** `GET /movies`' filters and sorts (the API's contract, on the fixtures) */
function listMovies(params: URLSearchParams, signedIn: boolean): MovieDetail[] | 'unauthorized' {
  const q = fold(params.get('q') ?? '');
  const averages = (params.get('average') ?? '').split(',').filter(Boolean);
  const ratedBy = params.get('ratedBy') && Number(params.get('ratedBy'));
  if (params.get('unratedByMe') === 'true' && !signedIn) return 'unauthorized';

  const found = movies.filter(movie => (
    (!q || fold(`${movie.title} ${movie.originalTitle}`).includes(q))
    && (!params.get('category') || movie.category === params.get('category'))
    && (!params.get('genre') || movie.genres.includes(params.get('genre')!))
    && (!averages.length || averages.includes(movie.rating.average!))
    && (!ratedBy || ratersOf(movie.id).includes(ratedBy))
    && (params.get('unratedByMe') !== 'true' || !ratersOf(movie.id).includes(ME))
  ));

  const sort = params.get('sort');
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

const signedIn = (req: Request) => (req.headers.get('Cookie') ?? '').split('; ').includes(SESSION_COOKIE);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const route = `${req.method} ${url.pathname}`;

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });

    if (route === 'GET /movies') {
      const found = listMovies(url.searchParams, signedIn(req));
      if (found === 'unauthorized') return problem(req, 401, 'Faça login para continuar.');
      // The mock's cursors are offsets; anything else is like a cursor from before an API change
      const cursor = url.searchParams.get('cursor');
      if (cursor !== null && !/^\d+$/.test(cursor)) return problem(req, 422, 'Cursor inválido.');
      const start = Number(cursor ?? 0);
      const end = start + PAGE_SIZE;
      return json(req, {
        data: found.slice(start, end).map(summary),
        nextCursor: end < found.length ? String(end) : null,
      });
    }

    if (route === 'GET /genres') {
      const names = [...new Set(movies.flatMap(movie => movie.genres))].sort();
      return json(req, { data: names.map(name => ({ name, count: movies.filter(m => m.genres.includes(name)).length })) });
    }

    if (route === 'GET /users') return json(req, { data: people });

    // With a backdrop, like production (it takes space above the list, which scroll restoration depends on)
    if (route === 'GET /movies/random') return json(req, { ...movies[0], backdropUrl: `http://localhost:${PORT}/backdrop.png` });

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
      if (!/themoviedb\.org\/(movie|tv)\//.test(body.url ?? '')) return problem(req, 422, 'Link do IMDb ou do TMDb inválido.');
      return json(req, { movie: { id: 1, slug: 'movie-1' } }, 201);
    }

    if (route === 'GET /health') return json(req, { status: 'ok' });

    return problem(req, 404);
  },
});

console.log(`Mock API on http://localhost:${PORT}`);
