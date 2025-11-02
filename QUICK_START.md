# Monorepo Quick Start Guide

## First Time Setup

1. **Install all dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**
   ```bash
   # Movies API
   cp movies-api/.env.example movies-api/.env
   # Edit movies-api/.env with your DATABASE_URL and API_KEY

   # Credentials API
   cp credentials-api/.env.example credentials-api/.env
   # Edit credentials-api/.env with your settings
   ```

3. **Run locally**
   ```bash
   # Terminal 1: Movies API
   npm run dev:movies

   # Terminal 2: Credentials API
   npm run dev:credentials
   ```

## Heroku Deployment

### Current Setup
- Movies API: `https://git.heroku.com/movie-api-group2.git` (remote: `heroku`)
- Credentials API: _Your second Heroku app_ (remote: `heroku-credentials`)

### Add Credentials Remote
```bash
heroku git:remote -a your-credentials-app-name
git remote rename heroku heroku-credentials

# Optionally rename movies remote for clarity
git remote set-url heroku https://git.heroku.com/movie-api-group2.git
git remote rename heroku heroku-movies
```

### Deploy to Heroku

**Movies API:**
```bash
git push heroku-movies main
```

**Credentials API:**
```bash
# Easiest method - deploy only the credentials-api subdirectory
git subtree push --prefix credentials-api heroku-credentials main
```

## Development Workflow

1. Make changes in `movies-api/` or `credentials-api/`
2. Test locally with `npm run dev:movies` or `npm run dev:credentials`
3. Commit changes: `git add . && git commit -m "your message"`
4. Push to GitHub: `git push origin main`
5. Deploy to Heroku:
   - Movies: `git push heroku-movies main`
   - Credentials: `git subtree push --prefix credentials-api heroku-credentials main`

## Troubleshooting

**Issue: Heroku not finding package.json**
- Solution: Use `git subtree push --prefix [api-name] [remote] main`

**Issue: Wrong API deployed**
- Check the root `Procfile` - it should point to the correct API directory

**Issue: Module not found**
- Run `npm run install:all` to reinstall dependencies

## Next Steps

1. Implement authentication routes in `credentials-api/src/routes/`
2. Add JWT token generation and validation
3. Create user database schema
4. Connect credentials API to a database
5. Add middleware for protected routes
