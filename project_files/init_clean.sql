-- ==========================================================
--  Movie Database Initialization Script
--  Creates tables and sample records for the Movie Web API
-- ==========================================================

-- Drop existing tables to avoid conflicts (drop in correct order)
DROP TABLE IF EXISTS movie_actor;
DROP TABLE IF EXISTS movie_genre;
DROP TABLE IF EXISTS movie;
DROP TABLE IF EXISTS actor;
DROP TABLE IF EXISTS genre;
DROP TABLE IF EXISTS director;
DROP TABLE IF EXISTS country;

-- =============================
--  Core Entity Tables
-- =============================

CREATE TABLE country (
    country_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE director (
    director_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE genre (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE actor (
    actor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE movie (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year INT CHECK (release_year >= 1990 AND release_year <= 2025),
    runtime_minutes INT CHECK (runtime_minutes > 0),
    rating DECIMAL(3,1) CHECK (rating BETWEEN 0 AND 10),
    box_office DECIMAL(15,2),
    director_id INT REFERENCES director(director_id) ON UPDATE CASCADE ON DELETE SET NULL,
    country_id INT REFERENCES country(country_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- =============================
--  Join Tables (Many-to-Many)
-- =============================

CREATE TABLE movie_genre (
    movie_id INT REFERENCES movie(movie_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genre(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE movie_actor (
    movie_id INT REFERENCES movie(movie_id) ON DELETE CASCADE,
    actor_id INT REFERENCES actor(actor_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, actor_id)
);

-- =============================
--  Sample Data
-- =============================

-- Countries
INSERT INTO country (name) VALUES
    ('United States'),
    ('United Kingdom'),
    ('Australia');

-- Directors
INSERT INTO director (name) VALUES
    ('Christopher Nolan'),
    ('Greta Gerwig'),
    ('Quentin Tarantino');

-- Genres
INSERT INTO genre (name) VALUES
    ('Action'),
    ('Drama'),
    ('Comedy'),
    ('Adventure');

-- Actors
INSERT INTO actor (name) VALUES
    ('Leonardo DiCaprio'),
    ('Margot Robbie'),
    ('Samuel L. Jackson'),
    ('Cillian Murphy');

-- Movies
INSERT INTO movie (title, release_year, runtime_minutes, rating, box_office, director_id, country_id)
VALUES
    ('Inception', 2010, 148, 8.8, 836800000, 1, 1),
    ('Barbie', 2023, 114, 7.8, 1445000000, 2, 1),
    ('Pulp Fiction', 1994, 154, 8.9, 213900000, 3, 1),
    ('Oppenheimer', 2023, 180, 8.6, 982000000, 1, 1);

-- Movie Genres
INSERT INTO movie_genre (movie_id, genre_id) VALUES
    (1, 1),
    (1, 4),
    (2, 2),
    (2, 3),
    (3, 1),
    (3, 2),
    (4, 2);

-- Movie Actors
INSERT INTO movie_actor (movie_id, actor_id) VALUES
    (1, 1),
    (1, 4),
    (2, 2),
    (3, 3),
    (4, 4);

