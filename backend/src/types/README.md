# Prisma Enums Workaround

## Overview

This directory contains a workaround for Prisma client generation issues. When `npx prisma generate` fails to properly generate the client with all enum exports, this file provides the enum definitions directly extracted from the schema.

## Usage

Instead of importing enums from `@prisma/client`:

```typescript
// ❌ This may fail if Prisma client is not properly generated
import { AppRole, StatutAffaire } from '@prisma/client';
```

Use the local enum definitions:

```typescript
// ✅ This works reliably
import { AppRole, StatutAffaire } from '../types/prisma-enums';
```

## Maintenance

When the Prisma schema is updated with new enums or enum values, update the corresponding definitions in `prisma-enums.ts`.

## Future

Once Prisma client generation is working properly, these imports can be switched back to `@prisma/client` and this file can be removed.

## Files Updated

The following files have been updated to use local enum imports:

- `src/contentieux/affaires/affaires.controller.ts`
- `src/contentieux/audiences/audiences.controller.ts`
- `src/auth/dto/auth.dto.ts`
- `src/users/users.controller.ts`
- `src/common/decorators/roles.decorator.ts`
- `src/common/guards/roles.guard.ts`
- And various DTO files in the contentieux module

## Verification

All TypeScript compilation errors related to missing Prisma enum exports have been resolved.