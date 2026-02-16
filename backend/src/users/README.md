# Users Module Documentation

## Overview

The **Users Module** provides comprehensive user management capabilities for the CAPCOS API, complementing the Authentication Module. It allows administrators to perform CRUD operations on users and manage role assignments (admin, collaborateur, compta).

## Architecture

### Components

- **UsersService**: Business logic layer extending `BaseCrudService<User>`
- **UsersController**: HTTP API endpoints with role-based access control
- **DTOs**: Data validation and transformation objects
- **Tests**: Unit tests, property-based tests, and integration tests

### Security Model

- All user management operations require **admin role**
- Non-admin users can only view their own profile
- Password hashing uses bcrypt (12 salt rounds)
- Email uniqueness is enforced at the database level
- Last admin prevention: System ensures at least one admin exists

## Endpoints

### List Users (Admin Only)
```http
GET /users?page=1&limit=20&filterByRole=collaborateur
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true,
      "roles": ["collaborateur"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "lastSignIn": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get User by ID
```http
GET /users/:id
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `id` (UUID): User ID

**Response**: User object (same as list)

### Create User (Admin Only)
```http
POST /users
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "roles": ["collaborateur", "compta"]
}
```

**Validation**:
- Email must be valid and unique
- Password minimum 8 characters
- Roles must be valid AppRole enum values

**Response**: 201 Created with user object

### Update User (Admin Only)
```http
PUT /users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "emailVerified": true
}
```

**Parameters**:
- `id` (UUID): User ID

**Fields** (optional):
- `email`: New email address (must be unique)
- `emailVerified`: Email verification status

**Response**: 200 OK with updated user object

### Delete User (Admin Only)
```http
DELETE /users/:id
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `id` (UUID): User ID

**Restrictions**:
- Cannot delete the last admin user
- Returns 400 Bad Request if attempted

**Response**: 200 OK with message

### Get User Roles
```http
GET /users/:id/roles
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `id` (UUID): User ID

**Response**:
```json
{
  "roles": ["collaborateur", "compta"]
}
```

### Assign Role to User (Admin Only)
```http
POST /users/:id/roles
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "compta"
}
```

**Parameters**:
- `id` (UUID): User ID
- `role` (AppRole): Role to assign (admin | collaborateur | compta)

**Restrictions**:
- Cannot assign a role that user already has

**Response**: 200 OK with message

### Remove Role from User (Admin Only)
```http
DELETE /users/:id/roles/:role
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `id` (UUID): User ID
- `role` (AppRole): Role to remove

**Restrictions**:
- Cannot remove the last admin role
- User must have the role to remove

**Response**: 200 OK with message

### Get Users by Role (Admin Only)
```http
GET /users/role/:role?page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `role` (AppRole): Role filter (admin | collaborateur | compta)

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response**: Paginated list of users with specified role

## DTOs

### CreateUserDto
```typescript
{
  email: string;           // Valid email, must be unique
  password: string;        // Minimum 8 characters
  roles?: AppRole[];       // Optional initial roles
}
```

### UpdateUserDto
```typescript
{
  email?: string;          // Optional new email
  emailVerified?: boolean; // Optional verification status
}
```

### AssignRoleDto
```typescript
{
  role: AppRole; // admin | collaborateur | compta
}
```

### UserResponseDto
```typescript
{
  id: string;
  email: string;
  emailVerified: boolean;
  roles: AppRole[];
  createdAt: Date;
  updatedAt: Date;
  lastSignIn?: Date;
  migrationSource?: string | null;
}
```

## Usage Examples

### JavaScript/TypeScript Client

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    Authorization: `Bearer ${jwtToken}`
  }
});

// Create user
const newUser = await client.post('/users', {
  email: 'collaborator@example.com',
  password: 'SecurePassword123!',
  roles: ['collaborateur']
});

// List all users
const users = await client.get('/users?page=1&limit=20');

// Assign role
await client.post(`/users/${userId}/roles`, {
  role: 'compta'
});

// Remove role
await client.delete(`/users/${userId}/roles/collaborateur`);

// Get users by role
const admins = await client.get('/users/role/admin');

// Delete user
await client.delete(`/users/${userId}`);
```

### cURL Examples

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "roles": ["collaborateur"]
  }'

# List users
curl -X GET http://localhost:3000/api/users?page=1&limit=20 \
  -H "Authorization: Bearer <token>"

# Assign role
curl -X POST http://localhost:3000/api/users/:id/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "compta"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/:id \
  -H "Authorization: Bearer <token>"
```

## Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

**403 Forbidden** (insufficient permissions):
```json
{
  "statusCode": 403,
  "message": "Only admins can create users",
  "error": "Forbidden"
}
```

**400 Bad Request** (validation error):
```json
{
  "statusCode": 400,
  "message": ["Password must be at least 8 characters"],
  "error": "Bad Request"
}
```

**409 Conflict** (email already exists):
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "User with ID abc123 not found",
  "error": "Not Found"
}
```

## Testing

### Run Unit Tests
```bash
npm test -- users.service.spec.ts
```

### Run Property-Based Tests
```bash
npm test -- users.service.pbt.spec.ts
```

### Run Integration Tests
```bash
npm test -- integration/auth-users.integration.spec.ts
```

### Run All Tests
```bash
npm test
```

## Security Considerations

1. **Always use HTTPS** in production
2. **JWT tokens should be short-lived** (recommend 1 hour)
3. **Store JWT tokens securely** in httpOnly cookies or secure storage
4. **Validate all inputs** via DTOs with class-validator
5. **Never expose passwords** in responses or logs
6. **Rate limit** authentication endpoints to prevent brute force
7. **Log all user management operations** via AuditLogInterceptor
8. **Enforce password requirements**:
   - Minimum 8 characters
   - Recommend mixing uppercase, lowercase, numbers, special characters

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  last_sign_in_at TIMESTAMP,
  migration_source VARCHAR(50),
  reset_token VARCHAR(255),
  reset_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### UserRoles Table (Many-to-Many)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, role)
);
```

## Performance Optimization

- Pagination is implemented with default limit of 20, max 100
- Database queries use indexing on `email` and `user_id`
- Relationships are eagerly loaded to prevent N+1 queries
- Email searches use case-insensitive matching

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration
- [ ] Permission-based access control (PBAC)
- [ ] User groups/teams management
- [ ] Session management and revocation
- [ ] Activity dashboard
- [ ] User preferences/settings
- [ ] Bulk user operations
