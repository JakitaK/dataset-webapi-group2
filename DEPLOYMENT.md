# Deployment Configuration

## Heroku Apps

### Movies API
- **App Name**: `movie-api-group2`
- **URL**: https://movie-api-group2-20e70498bde4.herokuapp.com
- **Git Remote**: `heroku-movies` (or `heroku`)
- **Directory**: `movies-api/`
- **Database**: Heroku Postgres (attached)
- **Current Version**: v33

### Credentials API  
- **App Name**: `[YOUR_CREDENTIALS_APP_NAME]`
- **URL**: `[TO_BE_CONFIGURED]`
- **Git Remote**: `heroku-credentials`
- **Directory**: `credentials-api/`
- **Database**: `[TO_BE_CONFIGURED]`
- **Current Version**: Not deployed yet

## Deployment Commands

### Movies API Deployment
```bash
# Full repository deploy (current setup)
git push heroku-movies main

# Or use subtree (if configured)
git subtree push --prefix movies-api heroku-movies main
```

### Credentials API Deployment
```bash
# Subtree deploy (recommended for monorepo)
git subtree push --prefix credentials-api heroku-credentials main

# First time only: Add remote
heroku git:remote -a [YOUR_CREDENTIALS_APP_NAME]
git remote rename heroku heroku-credentials
```

## Environment Variables

### Set on Heroku (Movies API)
```bash
heroku config:set DATABASE_URL="postgres://..." -a movie-api-group2
heroku config:set API_KEY="0b071ddf-967d-4b1a-b39d-47134d9cb881" -a movie-api-group2
```

### Set on Heroku (Credentials API)
```bash
heroku config:set DATABASE_URL="postgres://..." -a [YOUR_CREDENTIALS_APP_NAME]
heroku config:set JWT_SECRET="your-secret-here" -a [YOUR_CREDENTIALS_APP_NAME]
heroku config:set API_KEY="your-api-key" -a [YOUR_CREDENTIALS_APP_NAME]
```

## Viewing Logs

```bash
# Movies API
heroku logs --tail -a movie-api-group2

# Credentials API
heroku logs --tail -a [YOUR_CREDENTIALS_APP_NAME]
```

## Database Management

```bash
# Movies API - View database info
heroku pg:info -a movie-api-group2

# Movies API - Run SQL
heroku pg:psql -a movie-api-group2 -c "SELECT COUNT(*) FROM movie"

# Credentials API - Attach database
heroku addons:create heroku-postgresql:essential-0 -a [YOUR_CREDENTIALS_APP_NAME]
```

## Rollback

```bash
# If deployment breaks, rollback to previous version
heroku releases -a movie-api-group2
heroku rollback v32 -a movie-api-group2
```

## Notes

- Both APIs can share the same GitHub repository but deploy independently
- Use `git subtree` for cleaner subdirectory deployments
- Keep environment variables separate between apps
- Consider using separate databases for movies vs credentials
