## Repository snapshot

- Main language: Node.js (CommonJS). Entry: `src/server.js`.
- Server framework: Express. Database: PostgreSQL (dependency `pg`).
- OpenAPI design lives in `project_files/openapi.yaml` (source of truth for endpoints and schemas).

## Quick start (commands you can run locally)

- Install: `npm i`
- Start in dev (nodemon): `npm run dev` (reads `PORT` from env, defaults to 3000)
- Health endpoint: `GET /api/hello` (defined in `src/server.js`)

## Big-picture architecture (what to know first)

- This is a small Express API. Right now all runtime code is in `src/server.js` (single-file server). The OpenAPI file (`project_files/openapi.yaml`) describes a larger planned API (routes under `/api/v1/*`) including Movies, People, Taxonomy and Analytics resources.
- The project includes SQL initialization at `project_files/init.sql` and an ER diagram at `project_files/er_diagram.md`. These show the intended database schema for PostgreSQL.
- Dependency hints: `dotenv` is listed in `package.json` (load env vars via `.env`), and `pg` is included for DB access. You will typically expect a `DATABASE_URL` (or individual DB_* env vars) when implementing DB code.

## Conventions & patterns discovered here

- CommonJS modules (package.json `type: commonjs`). Use `require()`/`module.exports` unless you migrate the project to ESM.
- Routes prefix: planned API paths use `/api` and `/api/v1` (see `openapi.yaml`). Match those exact paths when adding endpoints.
- OpenAPI-first: `project_files/openapi.yaml` defines parameter names, allowed query params, and response schemas (e.g., `PagedMovies`, `MovieDetail`). Keep the YAML as the source of truth when implementing endpoints.
- Read-only alpha: The OpenAPI description states this alpha is read-only (no write endpoints). Expect mostly SELECT queries, paging, filtering, and analytics queries.

## Implementation notes for contributors / AI agents

- Where to add code now: `src/server.js` is the current runtime entry. For non-trivial features, create `src/routes/`, `src/controllers/`, and `src/db/` modules. Example layout:
  - `src/routes/movies.js` – express router for `/api/v1/movies`
  - `src/controllers/movies.js` – business logic translating query params to SQL
  - `src/db/index.js` – export a `pg.Pool` instance using `process.env.DATABASE_URL`
- DB initialization: use `project_files/init.sql` to build schema and seed data. Prefer running that manually in a local Postgres instance during development.
- Env vars: support `PORT` (already used), and expect `DATABASE_URL` for Postgres. `dotenv` is available; call `require('dotenv').config()` early in your app if you add `.env` files.
- Error responses: OpenAPI defines an `Error` schema with `{ error, details }` — return this structure on 4xx/5xx where applicable.

## Examples pulled from this repo (to copy/paste)

- Minimal server start (already present in `src/server.js`):

  - Health route: `app.get('/api/hello', (_req, res) => res.json({ message: 'Hello from Group 2 👋' }))`

- OpenAPI usage guidance: When implementing `GET /api/v1/movies`, map query params (q, genre, director, actor, yearMin/yearMax, limit/offset) to SQL with parameterized queries and return shape matching `PagedMovies` in `openapi.yaml`.

## Integration points & deployment

- Hosting: `openapi.yaml` and `README.md` mention Render/Heroku style deployments. Keep `PORT` environment variable support. Avoid hardcoding hostnames.
- Database: PostgreSQL is the intended backing store. The `pg` client should use connection pooling and graceful shutdown.

## Files to inspect when implementing or debugging

- `src/server.js` — current runtime and the place small changes end up.
- `project_files/openapi.yaml` — authoritative endpoint and schema definitions.
- `project_files/init.sql` — DB schema and seed expectations.
- `project_files/er_diagram.md` — conceptual data model.
- `package.json` — scripts: `start` and `dev` (nodemon).

## Notes for AI agents (do this before making edits)

- Read `openapi.yaml` to confirm parameter names and response schema names used in endpoints you implement.
- Do not assume existing DB helper files — add `src/db/` and wire `pg.Pool` using `process.env.DATABASE_URL`.
- Keep changes minimal and runnable: add a route, export router, and require it from `src/server.js`. Run `npm run dev` to validate.

If anything in this file is unclear or you want me to expand examples (router templates, DB helper, or a PR checklist), tell me which section to iterate on.
