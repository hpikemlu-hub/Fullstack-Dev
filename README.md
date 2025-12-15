# Workload Management API

Backend API untuk Workload Management System yang dibangun dengan Express.js dan SQLite.

## Features

- **Authentication**: JWT-based authentication dengan role-based access control
- **User Management**: CRUD operations untuk users (pegawai)
- **Workload Management**: CRUD operations untuk workload data
- **Data Validation**: Input validation dengan express-validator
- **Error Handling**: Comprehensive error handling middleware
- **Security**: Password hashing, CORS, helmet security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs, helmet, cors

## Installation

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run database seeding:
   ```bash
   npm run seed
   ```

5. Start server:
   ```bash
   npm start
   ```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database.sqlite
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Get Current User
```http
GET /api/auth/user
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### Users (Admin only)

#### Get All Users
```http
GET /api/users?page=1&limit=50
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "nama": "New User",
  "nip": "199001012015011001",
  "golongan": "III/c",
  "jabatan": "Analis",
  "role": "User"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "Updated Name",
  "jabatan": "Senior Analis"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

### User Profile

#### Get My Profile
```http
GET /api/users/profile/me
Authorization: Bearer <token>
```

#### Update My Profile
```http
PUT /api/users/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "Updated Name",
  "jabatan": "Senior Analis"
}
```

### Workloads

#### Get All Workloads (Admin: all, User: own only)
```http
GET /api/workload?page=1&limit=50&status=New&type=Rutin&search=keyword
Authorization: Bearer <token>
```

#### Get My Workloads
```http
GET /api/workload/my?page=1&limit=50
Authorization: Bearer <token>
```

#### Get Workload by ID
```http
GET /api/workload/:id
Authorization: Bearer <token>
```

#### Create Workload
```http
POST /api/workload
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "Workload Name",
  "type": "Rutin",
  "deskripsi": "Description",
  "status": "New",
  "tgl_diterima": "2025-12-14",
  "fungsi": "Pelaporan"
}
```

#### Update Workload
```http
PUT /api/workload/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Completed",
  "deskripsi": "Updated description"
}
```

#### Delete Workload
```http
DELETE /api/workload/:id
Authorization: Bearer <token>
```

#### Get Workload Options
```http
GET /api/workload/options
Authorization: Bearer <token>
```

#### Get Workload Statistics
```http
GET /api/workload/statistics
Authorization: Bearer <token>
```

## Default Users

### Admin User
- **Username**: admin
- **Password**: admin123
- **Role**: Admin

### Test Users
- **Username**: john_doe
- **Password**: password123
- **Role**: User

- **Username**: jane_smith
- **Password**: password123
- **Role**: User

- **Username**: bob_wilson
- **Password**: password123
- **Role**: User

- **Username**: alice_brown
- **Password**: password123
- **Role**: User

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nip VARCHAR(20),
    golongan VARCHAR(20),
    jabatan VARCHAR(100),
    role VARCHAR(20) DEFAULT 'User',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Workloads Table
```sql
CREATE TABLE workloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    nama VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    deskripsi TEXT,
    status VARCHAR(50) DEFAULT 'New',
    tgl_diterima DATE,
    fungsi VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2025-12-14T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)",
  "timestamp": "2025-12-14T12:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "username",
      "message": "Username is required",
      "value": ""
    }
  ],
  "timestamp": "2025-12-14T12:00:00.000Z"
}
```

## Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run seed`: Seed database with dummy data

## Security Features

- Password hashing with bcrypt
- JWT authentication with expiration
- Role-based access control (Admin/User)
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- SQL injection prevention with parameterized queries

## Error Handling

- Comprehensive error handling middleware
- Proper HTTP status codes
- Detailed error logging
- User-friendly error messages
- Development vs production error responses

## Performance Considerations

- Database connection pooling
- Pagination for large datasets
- Efficient query patterns
- Response caching ready
- Optimized database indexes

## Development

### Adding New Endpoints

1. Create controller method in `src/controllers/`
2. Add route in `src/routes/`
3. Add validation if needed in `src/middleware/validation.js`
4. Test with appropriate authentication/authorization

### Database Changes

1. Update schema in `src/config/database.js`
2. Update model methods in `src/models/`
3. Run migration script
4. Update seeding data if needed

## License

ISC License