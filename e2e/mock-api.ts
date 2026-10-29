// A stand-in for the API (../assisteai-api) with fixed data, so the e2e tests need no database.
// The shapes follow ../assisteai-back/docs/rewrite/05-api-design.md.
import type {
  MovieDetail, MovieSummary, RatingKey, User,
} from '../src/lib/types';

const PORT = Number(process.env.MOCK_API_PORT || 3999);
export const SESSION_COOKIE = 'session=e2e';

const RATING_KEYS: RatingKey[] = ['STAY_AWAY', 'VERY_BAD', 'BAD', 'COOL', 'GOOD', 'VERY_GOOD', 'UNMISSABLE'];

// 27 movies: a full first page (24) and a second, last page
const movies: MovieDetail[] = Array.from({ length: 27 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    slug: `movie-${id}`,
    category: id % 3 === 0 ? 'series' : 'movie',
    title: `Filme ${id}`,
    originalTitle: `Movie ${id}`,
    year: 2000 + id,
    posterUrl: null,
    backdropUrl: null,
    rating: { count: 2, average: 'VERY_GOOD', last: RATING_KEYS[id % RATING_KEYS.length] },
    genres: ['Drama', 'Sci-Fi & Fantasy'],
    description: `Description of movie ${id}.`,
    ratings: [
      {
        id: id * 10,
        rating: 'UNMISSABLE',
        comment: null,
        createdAt: '2026-10-01T12:00:00.000Z',
        user: { name: 'Ana', avatarUrl: null },
      },
      {
        id: id * 10 + 1,
        rating: 'GOOD',
        comment: 'Bom demais',
        createdAt: '2026-10-02T12:00:00.000Z',
        user: { name: 'Bruno', avatarUrl: null },
      },
    ],
  };
});

const user: User = { name: 'Usuário E2E', email: 'e2e@example.com', avatarUrl: null };

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

const PAGE_SIZE = 24;

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
      const start = Number(url.searchParams.get('cursor') ?? 0);
      const end = start + PAGE_SIZE;
      return json(req, {
        data: movies.slice(start, end).map(summary),
        nextCursor: end < movies.length ? String(end) : null,
      });
    }

    if (route === 'GET /movies/random') return json(req, movies[0]);

    const movieMatch = route.match(/^GET \/movies\/(\d+)$/);
    if (movieMatch) {
      const movie = movies.find(m => m.id === Number(movieMatch[1]));
      return movie ? json(req, movie) : problem(req, 404);
    }

    if (route === 'GET /me') return signedIn(req) ? json(req, { user }) : problem(req, 401, 'Faça login para continuar.');

    if (route === 'POST /auth/logout') return new Response(null, { status: 204, headers: corsHeaders(req) });

    if (route === 'POST /ratings') {
      if (!signedIn(req)) return problem(req, 401, 'Faça login para continuar.');
      const body = (await req.json()) as { url?: string };
      if (!body.url?.includes('themoviedb.org/movie/')) return problem(req, 422, 'Link do IMDb ou do TMDb inválido.');
      return json(req, { movie: { id: 1, slug: 'movie-1' } }, 201);
    }

    if (route === 'GET /health') return json(req, { status: 'ok' });

    return problem(req, 404);
  },
});

console.log(`Mock API on http://localhost:${PORT}`);
