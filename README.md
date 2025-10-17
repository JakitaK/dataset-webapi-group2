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

## Alpha Sprint Contribution
- **Primitivo Bambao** — Created the ER diagram, designed and wrote the SQL initialization script, and led the planning of the API’s proposed functionality.
- **Jakita Kaur** — Set up the GitHub repository, organized and added all project files, reviewed the ER diagram and functionality plan, and contributed to testing the hosting setup.  
- **Evan Tran** — Reviewed the ER diagram and functionality plan, assisted with testing and verifying the hosting setup on ......
- **George Njane** — Documentationn? 
  
## Alpha Sprint Meetings
- **Cadence and Format:** Communication occurred via Discord and in class.
- **Decision Log:**  
  - Selected the *Movies (Last 30 Years)* dataset for the API project.  
  - Chose Node.js/Express for backend and PostgreSQL for database.  
  - Tested ..... for hosting.  
  - Finalized ER diagram and database schema.  
  - Standardized all documentation in Markdown format.

## Alpha Sprint Comments
- Risks, blockers, dataset caveats, “code weirdness,” requests for feedback


