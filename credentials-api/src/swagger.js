const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Credentials API - Group 2',
      version: '1.0.0',
      description: 'Authentication and user management API with JWT-based authorization',
      contact: {
        name: 'Group 2',
        email: 'group2@example.com'
      }
    },
    servers: [
      {
        url: 'https://credentials-api-group2-20f368b8528b.herokuapp.com',
        description: 'Production (Heroku)'
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from login or register)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            account_id: {
              type: 'integer',
              description: 'Unique user ID',
              example: 1
            },
            firstname: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastname: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            phone: {
              type: 'string',
              description: 'Phone number (10 digits)',
              example: '1234567890'
            },
            account_role: {
              type: 'integer',
              description: 'User role: 1=User, 2=Moderator, 3=Admin, 4=SuperAdmin, 5=Owner',
              example: 1
            },
            email_verified: {
              type: 'boolean',
              description: 'Email verification status',
              example: false
            },
            phone_verified: {
              type: 'boolean',
              description: 'Phone verification status',
              example: false
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstname', 'lastname', 'email', 'username', 'password'],
          properties: {
            firstname: {
              type: 'string',
              minLength: 1,
              example: 'John'
            },
            lastname: {
              type: 'string',
              minLength: 1,
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            username: {
              type: 'string',
              minLength: 3,
              example: 'johndoe'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Must contain uppercase, lowercase, number, and special character',
              example: 'SecurePass123!'
            },
            phone: {
              type: 'string',
              pattern: '^[0-9]{10}$',
              description: 'Optional 10-digit phone number',
              example: '1234567890'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              example: 'SecurePass123!'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT token (expires in 14 days)',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        PasswordResetRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email must be verified to request password reset',
              example: 'john@example.com'
            }
          }
        },
        PasswordReset: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: {
              type: 'string',
              description: 'Reset token from email',
              example: 'a1b2c3d4e5f6...'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description: 'Must contain uppercase, lowercase, number, and special character',
              example: 'NewSecurePass123!'
            }
          }
        },
        PasswordChange: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              example: 'SecurePass123!'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description: 'Must contain uppercase, lowercase, number, and special character',
              example: 'NewSecurePass123!'
            }
          }
        },
        PhoneVerifySend: {
          type: 'object',
          required: ['phone', 'carrier_id'],
          properties: {
            phone: {
              type: 'string',
              pattern: '^[0-9]{10}$',
              description: '10-digit phone number',
              example: '1234567890'
            },
            carrier_id: {
              type: 'integer',
              minimum: 1,
              maximum: 8,
              description: 'Carrier ID (get from /auth/verify/carriers)',
              example: 1
            }
          }
        },
        PhoneVerifyCode: {
          type: 'object',
          required: ['phone', 'code'],
          properties: {
            phone: {
              type: 'string',
              pattern: '^[0-9]{10}$',
              example: '1234567890'
            },
            code: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              description: '6-digit verification code',
              example: '123456'
            }
          }
        },
        Carrier: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Verizon'
            },
            domain: {
              type: 'string',
              example: 'vtext.com'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            details: {
              type: 'string',
              example: 'Additional error details'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration, login, and password management'
      },
      {
        name: 'Verification',
        description: 'Email and SMS verification endpoints'
      },
      {
        name: 'User',
        description: 'Protected user endpoints (require JWT)'
      },
      {
        name: 'Health',
        description: 'API health and status checks'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const specs = swaggerJsdoc(options);
module.exports = specs;
