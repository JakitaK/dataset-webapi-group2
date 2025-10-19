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
        url: 'https://dataset-webapi-group2-1.onrender.com',
        description: 'Production server'
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

