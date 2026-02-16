# Authentication Module

This module provides comprehensive authentication and authorization functionality for the NestJS backend, with special support for users migrated from Supabase.

## Features

### Core Authentication
- **JWT-based authentication** with configurable expiration
- **Local strategy** for email/password login
- **Password hashing** using bcrypt with configurable salt rounds
- **Role-based authorization** with three roles: `admin`, `collaborateur`, `compta`

### Migrated User Support
- **Seamless login** for users migrated from Supabase
- **Temporary password handling** for migrated users
- **Password reset workflow** specifically designed for migrated users
- **Migration status tracking** to identify migrated vs. new users

### Security Features
- **Secure password reset** with time-limited tokens
- **Email verification** support
- **Last sign-in tracking**
- **JWT token validation** with user existence checks

## API Endpoints

### Public Endpoints

#### POST /auth/login
Login with email and password.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/register
Register a new user (non-migrated).
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "collaborateur"
}
```

#### POST /auth/password-reset-request
Request a password reset email.
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/password-reset
Reset password with token.
```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

### Protected Endpoints (Require JWT)

#### GET /auth/profile
Get current user profile.

#### POST /auth/change-password
Change password for authenticated user.
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### GET /auth/migration-status
Check if current user is migrated from Supabase.

#### GET /auth/migration-stats
Get migration statistics (admin endpoint).

#### GET /auth/validate
Validate JWT token.

## Usage Examples

### Basic Authentication Guard
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('protected')
async getProtectedResource() {
  return { message: 'This is protected' };
}
```

### Role-based Authorization
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { AppRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.admin)
@Get('admin-only')
async getAdminResource() {
  return { message: 'Admin only content' };
}
```

### Get Current User
```typescript
import { CurrentUser } from './auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Get('me')
async getCurrentUser(@CurrentUser() user: any) {
  return user;
}
```

### Public Endpoint
```typescript
import { Public } from './auth/decorators/public.decorator';

@Public()
@Get('public')
async getPublicResource() {
  return { message: 'This is public' };
}
```

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Email Configuration (for password reset)
EMAIL_SERVICE="smtp"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM="noreply@yourapp.com"
```

## Migrated User Workflow

1. **User migrated from Supabase** with temporary password
2. **User attempts login** with temporary credentials
3. **System allows login** but sets `requiresPasswordReset: true`
4. **Frontend prompts** user to change password
5. **User changes password** via `/auth/change-password`
6. **User can now login normally** without password reset requirement

## Security Considerations

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens include user roles and migration status
- Password reset tokens are time-limited (24 hours)
- User existence is validated on every JWT token validation
- Email addresses are used as unique identifiers
- Migration source is tracked for audit purposes

## Testing

The module includes comprehensive unit tests for both the service and controller:

```bash
# Run auth service tests
npm test auth.service.spec.ts

# Run auth controller tests
npm test auth.controller.spec.ts

# Run all auth tests
npm test -- --testPathPattern=auth
```

## Integration with Migration System

This auth module is specifically designed to work with the user migration system:

- **Supports migrated users** from Supabase with `migrationSource: 'supabase'`
- **Handles temporary passwords** for users requiring password reset
- **Preserves user IDs** from the original Supabase system
- **Tracks migration metadata** in the user profile
- **Provides migration statistics** for monitoring purposes