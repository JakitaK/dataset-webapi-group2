# Dataset Web API Monorepo (Group 2)# 🎬 Movie Dataset Web API - Group 2



This is a monorepo containing two separate APIs:This repository hosts our **Dataset Web API** project for TCSS 460.  

- **Movies API** - Movie database with comprehensive CRUD operationsOur dataset focuses on movies from the last 30 years, and this API will allow users to view, search, and analyze information such as titles, genres, directors, and release years.

- **Credentials API** - User authentication and credential management

## Getting Started

## 📁 Project Structure- `npm i`

- `npm run dev` for local

```- Environment: `PORT=3000`

dataset-webapi-group2/

├── movies-api/              # Movies API (deployed to movie-api-group2.herokuapp.com)## Importing Movie Data

│   ├── src/To load your CSV data into the database, run:

│   │   ├── server.js        # Movies API server

│   │   ├── controllers/     # Business logic```powershell

│   │   ├── routes/          # API routes# Example: import movies from CSV (run from project root)

│   │   ├── middleware/      # Movies-specific middlewarepsql -h localhost -U <youruser> -d <yourdb> -c "\copy movie(title, release_year, runtime_minutes, rating, box_office, director_id, country_id) FROM './data/movies_last30years.csv' CSV HEADER;"

│   │   ├── db/              # Database connection

│   │   └── swagger.js       # API documentation```

│   ├── package.jsonReplace `<youruser>` and `<yourdb>` with your Postgres username and database name. The column list must match your CSV header.

│   ├── Procfile

│   └── .env.example## Endpoints

│- `GET /api/hello` – sanity check

├── credentials-api/         # Credentials API (deploy to your second Heroku app)- See `/project_files/openapi.yaml` for full design.

│   ├── src/

│   │   ├── server.js        # Credentials API server---

│   │   ├── routes/          # Auth routes (to be implemented)

│   │   └── controllers/     # Auth logic (to be implemented)## URL link to the Heroku-hosted Data web API

│   ├── package.json- ** https://movie-api-group2-20e70498bde4.herokuapp.com/api-docs  

│   ├── Procfile

│   └── .env.example> 🔐 **Note:** To test any protected routes in the [Swagger UI](https://movie-api-group2-20e70498bde4.herokuapp.com/api-docs), click the green **“Authorize”** button at the top, enter your provided API key in the `x-api-key` field, and then click **Authorize → Close** before sending requests.

│

├── shared/                  # Shared utilities between APIs

│   ├── apiKeyAuth.js        # API key authentication middleware## Alpha Sprint Contribution

│   └── responseUtils.js     # Consistent response formatting- **Primitivo Bambao** — Created the ER diagram and led the planning of the API’s proposed functionality.  

│- **Primitivo Bambao** — Created the ER diagram, designed and wrote the SQL initialization script, and led the planning of the API’s proposed functionality.

├── data/                    # CSV data files- **Jakita Kaur** — Set up the GitHub repository, organized and added all project files, reviewed the ER diagram and functionality plan, and contributed to testing the hosting setup.  

├── scripts/                 # Data import and utility scripts- **Evan Tran** — Reviewed the ER diagram and functionality plan, assisted with testing and verifying the hosting setup on Render.

└── package.json            # Root package with convenience scripts- **George Njane** — Reviewed all steps.

```- 

## Alpha Sprint Contribution

## 🚀 Getting Started- **Primitivo Bambao** — Created the ER diagram, designed and wrote the SQL initialization script, and led the planning of the API’s proposed functionality.

- **Jakita Kaur** — Set up the GitHub repository, organized and added all project files, reviewed the ER diagram and functionality plan, and contributed to testing the hosting setup.  

### Install dependencies for both APIs- **Evan Tran** — Reviewed the ER diagram and functionality plan, assisted with testing and verifying the hosting setup on Render

```bash- **George Njane** — Reviewed all steps.

npm run install:all- **Primitivo Bambao** — Implemented the **DB-backed route** `/api/v1/moviebyyear`, wrote SQL/queries, and paired on Render environment configuration and query-parameter handling.

```- **Jakita Kaur** — Co-led Render troubleshooting (env variables, connection string, port), verified the route end-to-end, **updated README**, and prepared the final submission.  

- **Evan Tran** — Wrote and refined the **hosted API docs** (Swagger at `/api-docs`) for currently implemented routes.

### Set up environment variables- **George Njane** — Built the **Postman collection** and tests covering `moviebyyear` (valid/invalid years) and `hello`.

```bash- 

cp movies-api/.env.example movies-api/.env## Published Web API version Beta II Contribution

cp credentials-api/.env.example credentials-api/.env- **Primitivo Bambao** — Implemented the other half (`/movies/top-grossing`, `/movies/director/{id}`, `/movies/actor/{id}`), debugged all routes, and fixed the Heroku database connection.  

# Edit both .env files with your configuration- **Jakita Kaur** — Tested all routes in Postman, debugged issues, and implemented API key authorization middleware, finalized the README, and submitted the sprint.  

```- **Evan Tran** — Implemented and documented half of the new movie routes (`/movies`, `/movies/recent`, `/movies/top-rated`).  

- **George Njane** — Migrated the project from Render to Heroku and configured environment variables for API hosting.  

## 💻 Development

## Meetings

### Run Movies API locally### **10/15, 10:00–10:52 PM (Discord call, all members):**  

```bash  Walked through scope, split ownership, selected **Render** for hosting, outlined DB → API path.

npm run dev:movies  

# Runs on http://localhost:3000### **10/17, 4:00–4:47 PM (Discord call, all members):**  

```  Status check; confirmed progress; identified no blockers; aligned on remaining tasks.

### **10/19, 9:00–10:35 AM (Discord call, all members):**  

### Run Credentials API locally  Resolved Render ↔ PostgreSQL connection issues; validated `/api/v1/moviebyyear`; finalized submission list.

```bash

npm run dev:credentials### 10/21, 7:30PM–8:12PM (Discord call — all members)

# Runs on http://localhost:3001- **Where/How:** 42-minute voice call on Discord  

```- **What we did:** Reviewed Beta II sprint requirements, divided route work, decided to move hosting from Render to Heroku, discussed pagination and API key protection.



## 🌐 Deployment to Heroku### 10/24, 10:10PM–10:54PM (Discord call — all members)

- **Where/How:** 44-minute voice call on Discord  

### Setup Git Remotes- **What we did:** Updated progress, confirmed successful database migration on Heroku, identified routes needing debugging, verified pagination logic.



You already have the movies API remote. Add the credentials API:### 10/26, 9:00AM–10:27AM (Discord call — all members)

- **Where/How:** 87-minute voice call on Discord  

```bash- **What we did:** Final review of all routes, verified working deployment on Heroku, completed and tested API key middleware, ran Postman tests, and finalized README for submission.

# View current remotes

git remote -v**Primary Communication:**  

All group members used **Discord** for meetings and messaging, sharing updates, code snippets, and testing results during the Beta II sprint.

# Add credentials Heroku app

heroku git:remote -a your-credentials-app-name## Beta Sprint Comments

git remote rename heroku heroku-credentials- None:)



# Rename existing remote for clarity (optional)

git remote rename heroku heroku-movies
```

### Deploy Movies API
```bash
git push heroku-movies main
```

### Deploy Credentials API

**Option 1: Use subtree (recommended)**
```bash
git subtree push --prefix credentials-api heroku-credentials main
```

**Option 2: Temporarily update Procfile**
```bash
# Edit Procfile to: web: cd credentials-api && node src/server.js
git add Procfile
git commit -m "Update Procfile for credentials"
git push heroku-credentials main
# Then change back to movies-api
```

## 📚 API Documentation

### Movies API
- **Swagger UI**: https://movie-api-group2-20e70498bde4.herokuapp.com/api-docs
- **Health Check**: `GET /api/hello`
- **API Key Required**: `x-api-key: 0b071ddf-967d-4b1a-b39d-47134d9cb881`

### Credentials API
- **Health Check**: `GET /api/health`
- **Status**: Starter template - implement authentication routes

## 🔧 Available Scripts

- `npm run install:movies` - Install movies API dependencies
- `npm run install:credentials` - Install credentials API dependencies  
- `npm run install:all` - Install all dependencies
- `npm run dev:movies` - Run movies API in dev mode
- `npm run dev:credentials` - Run credentials API in dev mode

## 📖 Key Features

### Movies API (Fully Implemented)
✅ CRUD operations for movies and directors  
✅ Advanced filtering (MPA rating, year, genre, director, actor)  
✅ Pagination support  
✅ PostgreSQL database with 9,300+ movies  
✅ Swagger documentation  
✅ CORS enabled  
✅ API key authentication  

### Credentials API (Starter Template)
📝 Basic Express server setup  
📝 Ready for authentication implementation  
📝 Suggested features: JWT, bcrypt, user management  

## 👥 Team

Group 2 - TCSS 460

## 📄 License

ISC
