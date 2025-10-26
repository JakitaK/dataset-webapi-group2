const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movies API - Group 2',
      version: '1.0.0',
      description: 'A simple API for querying movie data from the last 30 years',
      contact: {
        name: 'Group 2',
        email: 'group2@example.com'
      }
    },
    servers: [
      {
        url: 'https://movie-api-group2-20e70498bde4.herokuapp.com',
        description: 'Production (Heroku)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Movie: {
          type: 'object',
          properties: {
            movie_id: {
              type: 'integer',
              description: 'Unique identifier for the movie'
            },
            title: {
              type: 'string',
              description: 'Title of the movie'
            },
            release_year: {
              type: 'integer',
              description: 'Year the movie was released'
            },
            runtime_minutes: {
              type: 'integer',
              description: 'Duration of the movie in minutes'
            },
            rating: {
              type: 'string',
              description: 'Movie rating'
            },
            box_office: {
              type: 'string',
              description: 'Box office revenue'
            },
            director_id: {
              type: 'integer',
              description: 'ID of the movie director'
            },
            country_id: {
              type: 'integer',
              description: 'ID of the country where the movie was produced'
            }
          }
        },
        MovieResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Movie'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of movies returned'
            }
          }
        },
        HelloResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Greeting message'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Number of items per page',
              example: 10
            },
            offset: {
              type: 'integer',
              description: 'Number of items skipped',
              example: 0
            },
            totalCount: {
              type: 'integer',
              description: 'Total number of items available',
              example: 5432
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there are more items after this page',
              example: true
            },
            hasPrevious: {
              type: 'boolean',
              description: 'Whether there are items before this page',
              example: false
            }
          }
        },
        PaginatedMoviesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Retrieved 10 top-rated movies'
            },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Movie'
                  }
                },
                pagination: {
                  $ref: '#/components/schemas/Pagination'
                }
              }
            }
          }
        },
        PaginatedMoviesWithIdResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Retrieved 8 movies for director ID 5'
            },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Movie'
                  }
                },
                pagination: {
                  $ref: '#/components/schemas/Pagination'
                },
                directorId: {
                  type: 'integer',
                  description: 'Director ID (for director route)',
                  example: 5
                },
                actorId: {
                  type: 'integer',
                  description: 'Actor ID (for actor route)',
                  example: 12
                }
              }
            }
          }
        },
        RecentMoviesResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Retrieved 145 movies from 2025'
            },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Movie'
                  }
                },
                total: {
                  type: 'integer',
                  description: 'Total number of movies for the year',
                  example: 145
                },
                year: {
                  type: 'integer',
                  description: 'The year of the movies returned',
                  example: 2025
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);
module.exports = specs;

