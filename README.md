# 🎬 Movie Dataset Web API - Group 2

This repository hosts our **Dataset Web API** project for TCSS 460.  
Our dataset focuses on movies from the last 30 years, and this API will allow users to view, search, and analyze information such as titles, genres, directors, and release years.

## Getting Started
- `npm i`
- `npm run dev` for local
- Environment: `PORT=3000`

## Importing Movie Data
To load your CSV data into the database, run:

```powershell
# Example: import movies from CSV (run from project root)
psql -h localhost -U <youruser> -d <yourdb> -c "\copy movie(title, release_year, runtime_minutes, rating, box_office, director_id, country_id) FROM './data/movies_last30years.csv' CSV HEADER;"
```
Replace `<youruser>` and `<yourdb>` with your Postgres username and database name. The column list must match your CSV header.

## Endpoints
- `GET /api/hello` – sanity check
- See `/project_files/openapi.yaml` for full design.

---
# Published Web API version Beta

## Hosted Web API (URLs)
- **Hello (sanity):** https://dataset-webapi-group2-1.onrender.com/api/hello  
- **Movies by Year (DB-backed):** https://dataset-webapi-group2-1.onrender.com/api/v1/moviebyyear?year=2023  
  > Change `year` to any valid year to see different results.

## Alpha Sprint Contribution
- **Primitivo Bambao** — Implemented the **DB-backed route** `/api/v1/moviebyyear`, wrote SQL/queries, and paired on Render environment configuration and query-parameter handling.
- **Jakita Kaur** — Co-led Render troubleshooting (env variables, connection string, port), verified the route end-to-end, **updated README**, and prepared the final submission.  
- **Evan Tran** — Wrote and refined the **hosted API docs** (Swagger at `/api-docs`) for currently implemented routes.
- **George Njane** — Built the **Postman collection** and tests covering `moviebyyear` (valid/invalid years) and `hello`.  
  
## Beta Sprint Meetings
- **10/15, 10:00PM–10:52 PM (Discord call, all members):**  
  Walked through scope, split ownership, selected **Render** for hosting, outlined DB → API path.
- **10/17, 4:00PM–4:47 PM (Discord call, all members):**  
  Status check; confirmed progress; identified no blockers; aligned on remaining tasks.
- **10/19, 9:00AM–10:35 AM (Discord call, all members):**  
  Resolved Render ↔ PostgreSQL connection issues; validated `/api/v1/moviebyyear`; finalized submission list.

**Primary communication during Beta:**  
- **Discord** for live calls and async chat  
- **GitHub** for code reviews, commits, and deploys

## Beta Sprint Comments
- None:)


