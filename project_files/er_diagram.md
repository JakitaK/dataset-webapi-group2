# ER Diagram

```mermaid
erDiagram
    MOVIE ||--o{ MOVIE_GENRE : "has"
    MOVIE ||--o{ MOVIE_ACTOR : "features"
    MOVIE }o--|| DIRECTOR : "directed by"
    MOVIE }o--|| COUNTRY : "produced in"

    MOVIE {
        int movie_id PK
        string title
        int release_year
        int runtime_minutes
        decimal rating
        decimal box_office
        int director_id FK
        int country_id FK
    }

    DIRECTOR {
        int director_id PK
        string name
    }

    COUNTRY {
        int country_id PK
        string name
    }

    GENRE {
        int genre_id PK
        string name
    }

    ACTOR {
        int actor_id PK
        string name
    }

    MOVIE_GENRE {
        int movie_id FK
        int genre_id FK
    }

    MOVIE_ACTOR {
        int movie_id FK
        int actor_id FK
    }

