# Credentials API

Authentication and user management API with JWT, email verification, and SMS verification support.

## Features

- ✅ **User Registration & Login** - JWT-based authentication
- ✅ **Password Security** - Bcrypt hashing with salt, password strength validation
- ✅ **Email Verification** - Token-based email verification (48-hour expiry)
- ✅ **Phone/SMS Verification** - 6-digit codes via email-to-SMS gateway (15-minute expiry)
- ✅ **Password Reset** - Secure password reset with email tokens (1-hour expiry)
- ✅ **Role-Based Access Control** - User, Moderator, Admin, SuperAdmin, Owner roles
- ✅ **Account Management** - Profile updates, password changes

## Quick Start

### 1. Install Dependencies

```bash
cd credentials-api
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/credentials_db
JWT_SECRET=your_secure_random_string_here
APP_BASE_URL=http://localhost:3001
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Set Up Database

Initialize the PostgreSQL database using `init.sql`:

```bash
psql -U your_user -d your_database -f init.sql
```

Or manually run the SQL commands in `init.sql`.

### 4. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API will run on `http://localhost:3001`

## API Endpoints

### Public Endpoints (No Authentication)

#### Authentication

- **POST** `/auth/register` - Register new user
- **POST** `/auth/login` - Login and get JWT token
- **POST** `/auth/password/reset-request` - Request password reset email
- **POST** `/auth/password/reset` - Reset password with token

#### Verification

- **GET** `/auth/verify/carriers` - Get list of supported SMS carriers
- **GET** `/auth/verify/email/confirm?token=xxx` - Verify email (from link)
- **GET** `/health` - Health check

### Protected Endpoints (Requires JWT)

Add `Authorization: Bearer <token>` header to all requests.

#### User Management

- **GET** `/auth/me` - Get current user info
- **POST** `/auth/user/password/change` - Change password

#### Verification

- **POST** `/auth/verify/email/send` - Send email verification
- **POST** `/auth/verify/phone/send` - Send SMS verification code
- **POST** `/auth/verify/phone/verify` - Verify SMS code

## Example Usage

### 1. Register a New User

```bash
POST /auth/register
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "phone": "1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John",
      "lastname": "Doe",
      "username": "johndoe",
      "role": "User",
      "emailVerified": false,
      "phoneVerified": false,
      "accountStatus": "pending"
    }
  }
}
```

### 2. Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John",
      "lastname": "Doe",
      "username": "johndoe",
      "role": "User",
      "emailVerified": true,
      "phoneVerified": true,
      "accountStatus": "active"
    }
  }
}
```

### 3. Send Email Verification

```bash
POST /auth/verify/email/send
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Development Mode):**

```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": {
    "expiresIn": "48 hours",
    "verificationUrl": "http://localhost:3001/auth/verify/email/confirm?token=a3f9d8e7..."
  }
}
```

### 4. Send SMS Verification

```bash
POST /auth/verify/phone/send
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "carrier": "att"
}
```

**Response (Development Mode):**

```json
{
  "success": true,
  "message": "SMS verification code sent successfully",
  "data": {
    "expiresIn": "15 minutes",
    "method": "email-to-sms",
    "availableCarriers": ["att", "tmobile", "verizon", "sprint", "metropcs", "boost", "cricket", "uscellular"],
    "verificationCode": "123456"
  }
}
```

### 5. Verify SMS Code

```bash
POST /auth/verify/phone/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "code": "123456"
}
```

## Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

## Security Features

### Password Security

- **Bcrypt hashing** with salt (10 rounds)
- **Separate credential table** - passwords not in main user table
- **Password strength validation** - enforced on registration and password changes

### Token Security

- **JWT tokens** - 14-day expiry for access tokens
- **Reset tokens** - 1-hour expiry for password resets
- **Verification tokens** - 48-hour expiry for email, 15-minute for SMS

### Rate Limiting

- **Email verification** - Max 1 request per 5 minutes
- **SMS verification** - Max 1 request per 1 minute
- **SMS attempts** - Max 3 attempts per code

### Account Protection

- **Email enumeration prevention** - consistent responses for reset requests
- **Account status** - pending, active, suspended, locked
- **Single-use tokens** - verification tokens deleted after use

## Database Schema

### Account Table

```sql
- Account_ID (Primary Key)
- FirstName, LastName, Username
- Email, Phone (Unique)
- Account_Role (1=User, 2=Moderator, 3=Admin, 4=SuperAdmin, 5=Owner)
- Email_Verified, Phone_Verified (Boolean)
- Account_Status (pending, active, suspended, locked)
- Created_At, Updated_At
```

### Account_Credential Table

```sql
- Credential_ID (Primary Key)
- Account_ID (Foreign Key, Unique)
- Salted_Hash, Salt
- Created_At, Updated_At
```

### Email_Verification Table

```sql
- Verification_ID (Primary Key)
- Account_ID (Foreign Key)
- Email, Verification_Token (Unique)
- Token_Expires, Created_At
```

### Phone_Verification Table

```sql
- Verification_ID (Primary Key)
- Account_ID (Foreign Key)
- Phone, Verification_Code
- Code_Expires, Attempts
- Created_At
```

## Development Mode

In development (`NODE_ENV !== 'production'`):

- Email/SMS content logged to console instead of sent
- Verification URLs/codes included in API responses
- Detailed error messages returned

## Production Deployment

### 1. Set Environment Variables on Heroku

```bash
heroku config:set NODE_ENV=production -a credentials-api-group2
heroku config:set JWT_SECRET=your_production_jwt_secret -a credentials-api-group2
heroku config:set APP_BASE_URL=https://credentials-api-group2.herokuapp.com -a credentials-api-group2
```

### 2. Provision Heroku Postgres

```bash
heroku addons:create heroku-postgresql:mini -a credentials-api-group2
```

### 3. Initialize Database

```bash
heroku pg:psql -a credentials-api-group2 < init.sql
```

### 4. Deploy

```bash
git subtree push --prefix credentials-api heroku-credentials main
```

## Email Service Integration (Production)

For production email/SMS sending, integrate with a service like SendGrid:

1. Install SendGrid:

```bash
npm install @sendgrid/mail
```

2. Add environment variables:

```env
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

3. Uncomment the SendGrid code in:
   - `src/utilities/emailService.js`
   - `src/utilities/smsService.js`

## Architecture

```
credentials-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Auth logic (register, login, password)
│   │   └── verificationController.js # Email/SMS verification
│   ├── middleware/
│   │   ├── jwtAuth.js              # JWT verification
│   │   └── validation.js           # Request validation
│   ├── routes/
│   │   ├── open.js                 # Public routes
│   │   └── closed.js               # Protected routes
│   ├── utilities/
│   │   ├── passwordUtils.js        # Password hashing/validation
│   │   ├── tokenUtils.js           # JWT generation/verification
│   │   ├── emailService.js         # Email sending
│   │   └── smsService.js           # SMS sending
│   ├── db/
│   │   └── index.js                # PostgreSQL connection pool
│   └── server.js                   # Express app
├── init.sql                        # Database schema
├── package.json
├── Procfile                        # Heroku deployment
└── .env.example
```

## License

MIT
