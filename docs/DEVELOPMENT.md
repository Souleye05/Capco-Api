# 🛠️ Guide de Développement - CAPCO API

Ce guide couvre les bonnes pratiques, l'architecture, et les workflows de développement pour l'API CAPCO.

## 🏗️ Architecture du Projet

### Structure des Dossiers

```
backend/
├── src/
│   ├── common/              # Services transversaux
│   │   ├── controllers/     # Contrôleurs de base
│   │   ├── decorators/      # Décorateurs personnalisés
│   │   ├── dto/            # DTOs partagés
│   │   ├── filters/        # Filtres d'exception
│   │   ├── guards/         # Guards de sécurité
│   │   ├── interceptors/   # Interceptors
│   │   ├── pipes/          # Pipes de validation
│   │   ├── services/       # Services de base
│   │   └── utils/          # Utilitaires
│   ├── auth/               # Module d'authentification
│   ├── contentieux/        # Module contentieux
│   ├── recouvrement/       # Module recouvrement
│   ├── immobilier/         # Module immobilier
│   ├── conseil/            # Module conseil
│   ├── config/             # Configuration
│   └── main.ts             # Point d'entrée
├── prisma/                 # Schéma et migrations
├── test/                   # Tests end-to-end
└── docs/                   # Documentation
```

### Principes Architecturaux

1. **Modularité** : Chaque domaine métier est un module indépendant
2. **Séparation des Responsabilités** : Controllers → Services → Repository
3. **Composition over Inheritance** : Utilisation de services abstraits
4. **Type Safety** : TypeScript strict avec interfaces
5. **Testabilité** : Injection de dépendances et mocking

## 🔧 Workflow de Développement

### 1. Création d'un Nouveau Module

```bash
# Générer un module avec NestJS CLI
nest generate module nom-module
nest generate controller nom-module
nest generate service nom-module

# Structure recommandée
src/nom-module/
├── controllers/
│   └── nom-module.controller.ts
├── services/
│   └── nom-module.service.ts
├── dto/
│   ├── create-nom-module.dto.ts
│   ├── update-nom-module.dto.ts
│   └── nom-module-query.dto.ts
├── entities/
│   └── nom-module.entity.ts
├── nom-module.module.ts
└── README.md
```

### 2. Implémentation d'un Service CRUD

```typescript
import { Injectable } from '@nestjs/common';
import { BaseCrudService, SecurityContext } from '../common';

@Injectable()
export class MonService extends BaseCrudService<
  MonEntity,
  CreateMonEntityDto,
  UpdateMonEntityDto,
  MonEntityQueryDto
> {
  protected modelName = 'monEntity';
  protected searchFields = ['nom', 'description'];

  // Implémentation des méthodes abstraites
  protected buildSecurityConditions(context: SecurityContext): any {
    return SecurityUtils.buildDefaultSecurityConditions(context);
  }

  protected async validateCreateData(
    data: CreateMonEntityDto,
    context: SecurityContext,
  ): Promise<any> {
    return {
      ...data,
      cabinetId: context.cabinetId,
      createdBy: context.userId,
    };
  }

  protected async validateUpdateData(
    data: UpdateMonEntityDto,
    context: SecurityContext,
    existing: MonEntity,
  ): Promise<any> {
    if (!SecurityUtils.canModifyEntity(context, existing)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return data;
  }

  protected async validateDeletePermissions(
    context: SecurityContext,
    item: MonEntity,
  ): Promise<void> {
    if (!SecurityUtils.canModifyEntity(context, item)) {
      throw new ForbiddenException('Cannot delete this item');
    }
  }
}
```

### 3. Création d'un Contrôleur

```typescript
import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../common';

@Controller('mon-endpoint')
@ApiTags('Mon Module')
export class MonController extends BaseCrudController<
  MonEntity,
  CreateMonEntityDto,
  UpdateMonEntityDto,
  MonEntityQueryDto
> {
  constructor(private readonly monService: MonService) {
    super(monService);
  }

  // Endpoints personnalisés
  @Get('statistics')
  @Roles('admin', 'collaborateur')
  @ApiOperation({ summary: 'Obtenir les statistiques' })
  async getStatistics(@CurrentUser() user: AuthenticatedUser) {
    const context = this.buildSecurityContext(user);
    return this.monService.getStatistics(context);
  }
}
```

## 📝 Standards de Code

### Conventions de Nommage

- **Fichiers** : kebab-case (`mon-service.ts`)
- **Classes** : PascalCase (`MonService`)
- **Variables/Fonctions** : camelCase (`monVariable`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_LIMIT`)
- **Interfaces** : PascalCase avec préfixe I optionnel (`SecurityContext`)

### Structure des DTOs

```typescript
// Create DTO
export class CreateAffaireDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Intitulé de l\'affaire' })
  intitule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartieDto)
  @ApiProperty({ type: [PartieDto] })
  demandeurs: PartieDto[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  notes?: string;
}

// Update DTO
export class UpdateAffaireDto extends PartialType(CreateAffaireDto) {
  @IsOptional()
  @IsEnum(StatutAffaire)
  @ApiProperty({ enum: StatutAffaire, required: false })
  statut?: StatutAffaire;
}

// Query DTO
export class AffairesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(StatutAffaire)
  @ApiProperty({ enum: StatutAffaire, required: false })
  statut?: StatutAffaire;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  juridiction?: string;
}

// Response DTO
export class AffaireResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  intitule: string;

  @ApiProperty({ enum: StatutAffaire })
  statut: StatutAffaire;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### Documentation Swagger

```typescript
@Controller('affaires')
@ApiTags('Contentieux')
@ApiBearerAuth()
export class AffairesController {
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle affaire' })
  @ApiResponse({ 
    status: 201, 
    description: 'Affaire créée avec succès',
    type: AffaireResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié' 
  })
  async create(@Body() createDto: CreateAffaireDto) {
    // Implémentation
  }
}
```

## 🧪 Tests

### Tests Unitaires

```typescript
describe('AffairesService', () => {
  let service: AffairesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffairesService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<AffairesService>(AffairesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create an affaire with generated reference', async () => {
      const createDto: CreateAffaireDto = {
        intitule: 'Test Affaire',
        demandeurs: [],
        defendeurs: [],
        juridiction: 'TGI Paris',
        chambre: '1ère Chambre',
      };

      const context: SecurityContext = {
        userId: 'user-1',
        roles: ['collaborateur'],
        cabinetId: 'cabinet-1',
      };

      const result = await service.create(createDto, context);

      expect(result).toBeDefined();
      expect(result.reference).toMatch(/^AFF-\d{4}-\d{3}$/);
      expect(result.intitule).toBe(createDto.intitule);
    });
  });
});
```

### Tests Property-Based

```typescript
describe('AffairesService - Property Tests', () => {
  it('should maintain reference uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          intitule: fc.string({ minLength: 1, maxLength: 100 }),
          juridiction: fc.string({ minLength: 1, maxLength: 50 }),
        }), { minLength: 1, maxLength: 10 }),
        async (affairesData) => {
          const references = new Set<string>();
          
          for (const data of affairesData) {
            const result = await service.create(data, mockContext);
            expect(references.has(result.reference)).toBe(false);
            references.add(result.reference);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Tests d'Intégration

```typescript
describe('AffairesController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Authentification
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@capco.com', password: 'password' });
    
    authToken = loginResponse.body.access_token;
  });

  it('/affaires (POST)', () => {
    return request(app.getHttpServer())
      .post('/affaires')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        intitule: 'Test Affaire E2E',
        demandeurs: [],
        defendeurs: [],
        juridiction: 'TGI Paris',
        chambre: '1ère Chambre',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.reference).toMatch(/^AFF-\d{4}-\d{3}$/);
      });
  });
});
```

## 🔐 Sécurité

### Authentification

```typescript
// Utilisation des guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'collaborateur')
@Controller('protected')
export class ProtectedController {
  @Get()
  getData(@CurrentUser() user: AuthenticatedUser) {
    // L'utilisateur est automatiquement injecté
  }
}
```

### Validation des Données

```typescript
// DTO avec validation
export class CreateUserDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  @ApiProperty()
  password: string;

  @IsArray()
  @IsEnum(AppRole, { each: true })
  @ApiProperty({ enum: AppRole, isArray: true })
  roles: AppRole[];
}
```

### Audit Automatique

```typescript
// Audit personnalisé
@AuditLog({ 
  action: 'EXPORT_DATA', 
  module: 'AFFAIRES',
  entityType: 'AFFAIRE' 
})
@Get('export')
async exportData() {
  // L'action sera automatiquement auditée
}
```

## 📊 Base de Données

### Migrations Prisma

```bash
# Créer une migration
npx prisma migrate dev --name add-new-field

# Appliquer les migrations
npx prisma migrate deploy

# Réinitialiser la base de données
npx prisma migrate reset
```

### Requêtes Optimisées

```typescript
// Utilisation des includes pour éviter N+1
async findAffairesWithDetails(context: SecurityContext) {
  return this.prisma.affaire.findMany({
    where: this.buildSecurityConditions(context),
    include: {
      audiences: {
        select: {
          id: true,
          dateAudience: true,
          typeAudience: true,
        },
      },
      honoraires: {
        where: { statut: 'FACTURE' },
        select: {
          montant: true,
          dateFacture: true,
        },
      },
    },
  });
}
```

## 🚀 Déploiement

### Build de Production

```bash
# Build
npm run build

# Tests avant déploiement
npm run test:cov
npm run test:e2e

# Vérification de sécurité
npm audit
```

### Variables d'Environnement Production

```env
NODE_ENV=production
LOG_LEVEL=warn
SWAGGER_ENABLED=false
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=1h
```

## 🔍 Debugging

### Logs Structurés

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MonService {
  private readonly logger = new Logger(MonService.name);

  async create(data: CreateDto) {
    this.logger.log(`Creating entity with data: ${JSON.stringify(data)}`);
    
    try {
      const result = await this.prisma.entity.create({ data });
      this.logger.log(`Entity created with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create entity: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### Profiling des Performances

```typescript
// Interceptor de performance
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          console.warn(`Slow request: ${context.getClass().name}.${context.getHandler().name} took ${duration}ms`);
        }
      }),
    );
  }
}
```

## 📚 Ressources

### Documentation Officielle
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Outils Utiles
- [Prisma Studio](https://www.prisma.io/studio) - Interface graphique pour la base de données
- [Swagger Editor](https://editor.swagger.io/) - Éditeur de documentation API
- [Postman](https://www.postman.com/) - Test des APIs

### Extensions VS Code Recommandées
- Prisma
- TypeScript Importer
- ESLint
- Prettier
- REST Client
- GitLens

---

🎯 **Prêt à développer !** Suivez ces guidelines pour maintenir la qualité et la cohérence du code.