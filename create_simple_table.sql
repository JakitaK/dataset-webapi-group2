-- Simple movies table that matches the CSV structure
-- This will be run on Heroku to create the table and import data

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    release_date DATE,
    runtime INTEGER,
    genres TEXT,
    overview TEXT,
    budget BIGINT,
    revenue BIGINT,
    studios TEXT,
    producers TEXT,
    director_name TEXT,
    mpa_rating VARCHAR(10),
    collection VARCHAR(255),
    poster_url TEXT,
    backdrop_url TEXT,
    studio_logos TEXT,
    studio_countries TEXT,
    actors TEXT -- Combined actors as comma-separated text for simplicity
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_director ON movies(director_name);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_mpa_rating ON movies(mpa_rating);