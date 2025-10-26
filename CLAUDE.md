# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm i` - Install dependencies
- `npm run dev` - Start server with nodemon (auto-reload on changes)
- `npm start` - Start server in production mode

**Environment Variables:**
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string (used on Heroku/Render)
- Local development requires: `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`

## Architecture

**Technology Stack:**
- Node.js with Express (CommonJS modules - use `require()`/`module.exports`)
- PostgreSQL database via `pg` connection pool
- Swagger UI for API documentation at `/api-docs`

**Project Structure:**
- `src/server.js` - Main entry point, mounts routes and Swagger UI
- `src/db/index.js` - PostgreSQL connection pool (supports both `DATABASE_URL` and individual PG env vars)
- `src/routes/` - Express routers for API endpoints
- `src/swagger.js` - Swagger JSDoc configuration
- `project_files/openapi.yaml` - OpenAPI specification (source of truth for API design)
- `project_files/init.sql` - Database schema and seed data
- `project_files/er_diagram.md` - Entity-relationship diagram

**Database Schema:**
The database has a central `movie` table with foreign keys to:
- `director` (many-to-one)
- `country` (many-to-one)
- `genre` via `movie_genre` join table (many-to-many)
- `actor` via `movie_actor` join table (many-to-many)

**API Design Pattern:**
- All API routes use `/api` or `/api/v1` prefix
- Error responses follow `{ error: string, details?: string }` schema
- Success responses typically include `{ data: array, total: number }`
- The API is read-only (no POST/PUT/DELETE endpoints currently)

## Implementation Guidelines

**Database Connection:**
- The app auto-detects environment: uses `DATABASE_URL` on Heroku/Render, individual PG vars locally
- Connection pool is shared via `require('./db')` - reuse it, don't create new pools
- Server implements graceful shutdown that closes the pool on SIGTERM/SIGINT

**Adding New Routes:**
1. Create router file in `src/routes/` (e.g., `src/routes/movies.js`)
2. Add Swagger JSDoc comments above route handlers for automatic API documentation
3. Import and mount router in `src/server.js` using `app.use('/api/v1', router)`
4. Use parameterized queries to prevent SQL injection: `pool.query(sql, [param1, param2])`
5. Return responses matching schemas defined in `src/swagger.js`

**Swagger Documentation:**
- Route documentation uses JSDoc comments with `@swagger` tags
- Schemas are centrally defined in `src/swagger.js` under `components.schemas`
- Swagger scans `./src/routes/*.js` and `./src/server.js` for annotations
- Reference schemas using `$ref: '#/components/schemas/SchemaName'`

**Deployment:**
- Production servers: Heroku and Render (both URLs in `openapi.yaml`)
- Both use `DATABASE_URL` environment variable for PostgreSQL
- Ensure `PORT` is read from `process.env.PORT` for cloud hosting compatibility
