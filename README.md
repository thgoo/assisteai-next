# assisteai-next

Frontend of Assiste Aí, a movie and series rating site: Next.js (App Router, Cache Components) + TypeScript. It talks to
the API in `../assisteai-api`.

## Running

```sh
bun install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL to a local API
bun run dev                  # http://localhost:3003 (the origin the API allows locally)
```

Use `localhost`, not `127.0.0.1`, for both the front and the API, so the API's session cookie is same-site.

## Checks

```sh
bun run typecheck
bun run lint
bun run test:e2e             # builds and serves the front against e2e/mock-api.ts (no real API needed)
```

The first `test:e2e` needs a browser: `bunx playwright install chromium`. CI (`.github/workflows/ci.yml`) runs all three.

## Caching

- Movie pages: the latest movies are prerendered at build time, the others on their first visit. Data is cached for 5
  minutes; a new rating refreshes the movie and the list right away (`src/app/actions.ts`). Unknown ids answer `404`.
- Home: the first page of the list is cached and rendered on the server; the random backdrop is fetched per visit.

## Production

Single host, PM2 ([`ecosystem.config.cjs`](ecosystem.config.cjs)), like `../bargah.com.br/bargah`. Deploy with
`scripts/deploy.sh` (pull, install, build, restart). The build prerenders movie pages, so the API must be up, and
`NEXT_PUBLIC_*` variables must be set when building. `API_INTERNAL_URL` lets the server reach the API without leaving the
host.

The PM2 app is `assisteai.com.br` on port 3003 (nginx proxies to `127.0.0.1:3003`). Another copy of the site, like the
staging one at `/var/www/beta2.assisteai.com.br`, names its own app and port in a `.env.deploy` file (not committed):

```sh
APP_NAME=beta2.assisteai.com.br
PORT=3008
```

The process from before this setup was started with `yarn start -p 3003`, and PM2 keeps a process's command across
restarts, so switch it once (likewise for a copy first started by hand):

```sh
pm2 delete assisteai.com.br && pm2 start ecosystem.config.cjs && pm2 save
```

## Layout

- `src/app`: routes. `/` (list + random backdrop) and `/movies/[movieId]` (`<id>-<slug>`).
- `src/components`: one folder per component, with its CSS module.
- `src/lib`: API client (`api.ts`), server reads with `'use cache'` (`movies.ts`), API types and rating labels.
- `e2e`: Playwright smoke tests and the mock API they run against.
