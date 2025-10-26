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

## URL link to the Heroku-hosted Data web API
- ** https://movie-api-group2-20e70498bde4.herokuapp.com/api-docs  

> 🔐 **Note:** To test any protected routes in the [Swagger UI](https://movie-api-group2-20e70498bde4.herokuapp.com/api-docs), click the green **“Authorize”** button at the top, enter your provided API key in the `x-api-key` field, and then click **Authorize → Close** before sending requests.


## Published Web API version Beta II Contribution
- **Primitivo Bambao** — Implemented the other half (`/movies/top-grossing`, `/movies/director/{id}`, `/movies/actor/{id}`), debugged all routes, and fixed the Heroku database connection.  
- **Jakita Kaur** — Tested all routes in Postman, debugged issues, and implemented API key authorization middleware, finalized the README, and submitted the sprint.  
- **Evan Tran** — Implemented and documented half of the new movie routes (`/movies`, `/movies/recent`, `/movies/top-rated`).  
- **George Njane** — Migrated the project from Render to Heroku and configured environment variables for API hosting.  

## Published Web API version Beta II Meetings

### 10/21, 7:30PM–8:12PM (Discord call — all members)
- **Where/How:** 42-minute voice call on Discord  
- **What we did:** Reviewed Beta II sprint requirements, divided route work, decided to move hosting from Render to Heroku, discussed pagination and API key protection.

### 10/24, 10:10PM–10:54PM (Discord call — all members)
- **Where/How:** 44-minute voice call on Discord  
- **What we did:** Updated progress, confirmed successful database migration on Heroku, identified routes needing debugging, verified pagination logic.

### 10/26, 9:00AM–10:27AM (Discord call — all members)
- **Where/How:** 87-minute voice call on Discord  
- **What we did:** Final review of all routes, verified working deployment on Heroku, completed and tested API key middleware, ran Postman tests, and finalized README for submission.

**Primary Communication:**  
All group members used **Discord** for meetings and messaging, sharing updates, code snippets, and testing results during the Beta II sprint.

## Beta Sprint Comments
- None:)


