# PaginationService - Generic Pagination for NestJS with Prisma

## Overview

The `PaginationService` is a generic, reusable service that centralizes all pagination logic for Prisma models in NestJS applications. It eliminates code duplication across services and provides consistent pagination behavior throughout the application.

## Features

- ✅ **Generic TypeScript support** - Works with any Prisma model
- ✅ **Optimized queries** - Uses Prisma `$transaction([findMany, count])` for performance
- ✅ **Dynamic search** - Supports `contains + mode: insensitive` on multiple fields
- ✅ **Dynamic sorting** - Supports nested field sorting with `orderBy`
- ✅ **Automatic metadata calculation** - `totalPages`, `hasNext`, `hasPrev`
- ✅ **Flexible filtering** - Custom `where` clauses with search combination
- ✅ **Relation support** - `include` and `select` options
- ✅ **Autocomplete helper** - `searchOnly` method for quick searches

## Installation

The service is automatically available in all modules through the `CommonModule` (marked as `@Global()`).

```typescript
// Already included in CommonModule
import { PaginationService } from '../common/services/pagination.service';
```

## Basic Usage

### Simple Pagination

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    return this.paginationService.paginate(
      this.prisma.user,
      query,
      {
        searchFields: ['email', 'name'],
        defaultSortBy: 'createdAt',
      }
    );
  }
}
```

### With Relations and Custom Filters

```typescript
async findAffaires(query: PaginationQueryDto): Promise<PaginatedResponse<Affaire>> {
  return this.paginationService.paginate(
    this.prisma.affaires,
    query,
    {
      where: { statut: 'ACTIVE' }, // Custom filter
      include: {
        audienceses: true,
        honorairesContentieuxes: true,
      },
      searchFields: ['reference', 'intitule', 'juridiction'],
      defaultSortBy: 'updatedAt',
    }
  );
}
```

## API Reference

### `paginate<T>()` Method

```typescript
async paginate<T>(
  delegate: any,                    // Prisma model delegate (e.g., prisma.user)
  paginationQuery: PaginationQueryDto,  // Pagination parameters
  options: PaginationOptions = {}   // Additional options
): Promise<PaginatedResponse<T>>
```

#### Parameters

- **`delegate`** - Prisma model delegate (e.g., `this.prisma.user`, `this.prisma.affaires`)
- **`paginationQuery`** - Query parameters from request:
  - `page?: number` - Page number (default: 1)
  - `limit?: number` - Items per page (default: 20, max: 100)
  - `search?: string` - Search term
  - `sortBy?: string` - Field to sort by
  - `sortOrder?: 'asc' | 'desc'` - Sort direction (default: 'desc')

- **`options`** - Configuration options:
  - `where?: any` - Prisma where clause for filtering
  - `include?: any` - Prisma include clause for relations
  - `select?: any` - Prisma select clause for field selection
  - `searchFields?: string[]` - Fields to search in (supports nested: `'user.email'`)
  - `defaultSortBy?: string` - Default sort field if none provided

#### Returns

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### `searchOnly<T>()` Method

Helper method for autocomplete functionality:

```typescript
async searchOnly<T>(
  delegate: any,
  search: string,
  searchFields: string[],
  limit: number = 10
): Promise<T[]>
```

## Advanced Examples

### Complex Filtering with Business Logic

```typescript
async findActiveAffaires(query: PaginationQueryDto): Promise<PaginatedResponse<Affaire>> {
  return this.paginationService.paginate(
    this.prisma.affaires,
    query,
    {
      where: {
        statut: 'ACTIVE',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        audienceses: {
          where: { statut: 'A_VENIR' },
          orderBy: { date: 'asc' },
          take: 5,
        },
      },
      searchFields: ['reference', 'intitule', 'juridiction'],
      defaultSortBy: 'updatedAt',
    }
  );
}
```

### Nested Field Search and Sorting

```typescript
async findUsersWithRoles(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
  const customQuery = {
    ...query,
    sortBy: 'userRoles.role', // Sort by nested field
  };

  return this.paginationService.paginate(
    this.prisma.user,
    customQuery,
    {
      include: {
        userRoles: {
          select: { role: true },
        },
      },
      searchFields: ['email', 'userRoles.role'], // Search in nested fields
      defaultSortBy: 'createdAt',
    }
  );
}
```

### Autocomplete Search

```typescript
async searchUsers(search: string): Promise<User[]> {
  return this.paginationService.searchOnly(
    this.prisma.user,
    search,
    ['email', 'name'],
    10
  );
}
```

## Migration from Manual Pagination

### Before (Manual Implementation)

```typescript
async findAll(query: PaginationQueryDto): Promise<{ data: User[]; total: number }> {
  const { page = 1, limit = 20, search } = query;
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count({ where }),
  ]);

  return { data: users, total };
}
```

### After (Using PaginationService)

```typescript
async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
  return this.paginationService.paginate(
    this.prisma.user,
    query,
    {
      searchFields: ['email', 'name'],
      defaultSortBy: 'createdAt',
    }
  );
}
```

## Performance Considerations

1. **Optimized Queries**: Uses `$transaction([findMany, count])` for parallel execution
2. **Index Usage**: Ensure database indexes on frequently searched/sorted fields
3. **Limit Constraints**: Maximum limit of 100 items per page (configurable in DTO)
4. **Search Optimization**: Use specific `searchFields` rather than searching all fields

## Error Handling

The service handles Prisma errors gracefully and lets them bubble up to your service layer where you can apply specific error handling logic.

```typescript
async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
  try {
    return await this.paginationService.paginate(
      this.prisma.user,
      query,
      { searchFields: ['email'] }
    );
  } catch (error) {
    this.logger.error(`Error paginating users: ${error.message}`);
    throw error;
  }
}
```

## Best Practices

1. **Always specify searchFields** - Don't leave it empty if you want search functionality
2. **Use appropriate defaultSortBy** - Choose fields that have database indexes
3. **Combine with business logic** - Use the `where` option for domain-specific filtering
4. **Leverage relations** - Use `include`/`select` for efficient data fetching
5. **Consider nested searches** - Use dot notation for searching in related models
6. **Cache when appropriate** - Consider caching for frequently accessed, slowly changing data

## TypeScript Support

The service is fully typed and provides excellent IntelliSense support:

```typescript
// Type inference works automatically
const result = await this.paginationService.paginate<UserWithRoles>(
  this.prisma.user,
  query,
  options
);

// result.data is typed as UserWithRoles[]
// result.pagination is typed as PaginationMeta
```

## Testing

Example unit test for a service using PaginationService:

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let paginationService: PaginationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PaginationService,
          useValue: {
            paginate: jest.fn(),
          },
        },
        // ... other providers
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should paginate users', async () => {
    const mockResult = {
      data: [{ id: '1', email: 'test@example.com' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    jest.spyOn(paginationService, 'paginate').mockResolvedValue(mockResult);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(paginationService.paginate).toHaveBeenCalledWith(
      expect.any(Object), // prisma delegate
      { page: 1, limit: 20 },
      expect.objectContaining({
        searchFields: ['email'],
      })
    );
    expect(result).toEqual(mockResult);
  });
});
```