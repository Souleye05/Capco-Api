# Module Common - Services Transversaux

## 📋 Vue d'Ensemble

Le module Common fournit l'infrastructure transversale pour l'API CAPCO NestJS. Il centralise tous les composants réutilisables : sécurité, validation, audit, gestion d'erreurs et services CRUD de base.

## 🏗️ Architecture

```
src/common/
├── controllers/          # Contrôleurs de base
│   └── base-crud.controller.ts
├── decorators/           # Décorateurs personnalisés
│   ├── audit-log.decorator.ts
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
├── dto/                  # Data Transfer Objects
│   └── pagination.dto.ts
├── examples/             # Exemples d'implémentation
│   └── affaires.service.example.ts
├── filters/              # Filtres d'exception
│   ├── all-exceptions.filter.ts
│   └── prisma-exception.filter.ts
├── guards/               # Guards de sécurité
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── interceptors/         # Interceptors
│   ├── audit-log.interceptor.ts
│   ├── logging.interceptor.ts
│   └── transform.interceptor.ts
├── pipes/                # Pipes de validation
│   ├── parse-uuid.pipe.ts
│   └── validation.pipe.ts
├── services/             # Services de base
│   ├── base-crud.service.ts
│   └── prisma.service.ts
├── utils/                # Utilitaires
│   └── security.utils.ts
├── common.module.ts      # Module principal
├── common.pbt.spec.ts    # Tests property-based
└── index.ts              # Exports
```

## 🔐 Sécurité

### Guards

#### JwtAuthGuard
- **Rôle** : Authentification JWT avec support des endpoints publics
- **Fonctionnalités** :
  - Validation automatique des tokens JWT
  - Support du décorateur `@Public()` pour les endpoints ouverts
  - Gestion des erreurs d'authentification

```typescript
@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {
  @Public() // Endpoint accessible sans authentification
  @Get('public')
  getPublicData() {}
  
  @Get('private') // Authentification requise
  getPrivateData() {}
}
```

#### RolesGuard
- **Rôle** : Autorisation basée sur les rôles
- **Fonctionnalités** :
  - Vérification des rôles utilisateur
  - Support des rôles multiples
  - Type safety avec interfaces TypeScript

```typescript
@Roles('admin', 'collaborateur')
@Get('admin-only')
adminOnlyEndpoint() {}
```

### Utilitaires de Sécurité

#### SecurityUtils
- **Rôle** : Fonctions utilitaires pour la gestion de la sécurité
- **Fonctionnalités** :
  - Vérification des rôles
  - Contrôle d'accès par cabinet
  - Construction des conditions de sécurité

```typescript
// Vérifier si l'utilisateur peut modifier une entité
SecurityUtils.canModifyEntity(context, entity);

// Construire les conditions de sécurité par défaut
SecurityUtils.buildDefaultSecurityConditions(context);
```

## 📊 Services CRUD

### BaseCrudService
- **Rôle** : Service abstrait pour les opérations CRUD standardisées
- **Fonctionnalités** :
  - CRUD complet avec pagination
  - Sécurité intégrée (équivalent RLS)
  - Recherche et filtrage
  - Validation automatique
  - Audit intégré

```typescript
@Injectable()
export class AffairesService extends BaseCrudService<Affaire, CreateAffaireDto, UpdateAffaireDto> {
  protected modelName = 'affaire';
  protected searchFields = ['reference', 'intitule', 'notes'];
  
  protected buildSecurityConditions(context: SecurityContext): any {
    return SecurityUtils.buildDefaultSecurityConditions(context);
  }
  
  // Implémentation des méthodes abstraites...
}
```

### BaseCrudController
- **Rôle** : Contrôleur abstrait pour les endpoints CRUD standardisés
- **Fonctionnalités** :
  - Endpoints CRUD complets
  - Validation automatique
  - Audit intégré
  - Gestion des erreurs

```typescript
@Controller('affaires')
export class AffairesController extends BaseCrudController<Affaire, CreateAffaireDto, UpdateAffaireDto> {
  constructor(private readonly affairesService: AffairesService) {
    super(affairesService);
  }
  
  // Endpoints personnalisés peuvent être ajoutés ici
}
```

## 🔍 Audit et Logging

### AuditLogInterceptor
- **Rôle** : Audit automatique des actions utilisateur
- **Fonctionnalités** :
  - Capture automatique de toutes les actions CRUD
  - Extraction des métadonnées (module, action, entité)
  - Gestion des erreurs d'audit sans impact sur les requêtes
  - Sanitisation des données sensibles

```typescript
@AuditLog({ action: 'CUSTOM_ACTION', module: 'AFFAIRES' })
@Post('custom')
customAction() {}
```

### LoggingInterceptor
- **Rôle** : Logging des requêtes HTTP
- **Fonctionnalités** :
  - Temps de réponse
  - Informations de la requête (IP, User-Agent)
  - Logging des erreurs

## ✅ Validation

### ValidationPipe
- **Rôle** : Validation des DTOs avec class-validator
- **Fonctionnalités** :
  - Validation automatique des données d'entrée
  - Messages d'erreur détaillés par champ
  - Transformation automatique des types

### ParseUUIDPipe
- **Rôle** : Validation des UUIDs dans les paramètres
- **Fonctionnalités** :
  - Validation du format UUID
  - Messages d'erreur explicites

## 🚨 Gestion d'Erreurs

### AllExceptionsFilter
- **Rôle** : Gestion globale des erreurs
- **Fonctionnalités** :
  - Réponses d'erreur structurées
  - Niveaux de détail par environnement
  - Sanitisation des informations sensibles
  - Logging approprié

### PrismaExceptionFilter
- **Rôle** : Gestion spécialisée des erreurs Prisma
- **Fonctionnalités** :
  - Mapping des codes d'erreur Prisma vers HTTP
  - Messages utilisateur conviviaux
  - Gestion des contraintes de base de données

## 🔄 Interceptors

### TransformInterceptor
- **Rôle** : Transformation des réponses API
- **Fonctionnalités** :
  - Format de réponse standardisé
  - Métadonnées automatiques (timestamp, path, status)
  - Transformation avec class-transformer

## 📝 DTOs et Types

### PaginationQueryDto
- **Rôle** : DTO pour les requêtes de pagination
- **Fonctionnalités** :
  - Validation des paramètres de pagination
  - Limites configurables
  - Support du tri et de la recherche

### Interfaces TypeScript
```typescript
interface SecurityContext {
  userId: string;
  roles: string[];
  cabinetId?: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Array<{ role: string }>;
  cabinetId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

## 🧪 Tests

### Tests Property-Based (PBT)
- **Fichier** : `common.pbt.spec.ts`
- **Couverture** : 
  - Propriété 14: Gestion cohérente des erreurs
  - 5 sous-propriétés testées avec fast-check
  - 50+ itérations par test pour découvrir les cas limites

### Résultats des Tests
Les tests PBT ont identifié des incohérences dans :
- Gestion des niveaux d'erreur par environnement
- Sanitisation des données sensibles
- Mapping des codes d'erreur Prisma

## 🚀 Utilisation

### 1. Import du Module
```typescript
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule],
  // ...
})
export class AppModule {}
```

### 2. Création d'un Service Métier
```typescript
@Injectable()
export class MonService extends BaseCrudService<MonEntity, CreateDto, UpdateDto> {
  protected modelName = 'monEntity';
  protected searchFields = ['nom', 'description'];
  
  // Implémentation des méthodes abstraites
  protected buildSecurityConditions(context: SecurityContext): any {
    return SecurityUtils.buildDefaultSecurityConditions(context);
  }
  
  protected async validateCreateData(data: CreateDto, context: SecurityContext): Promise<any> {
    return { ...data, cabinetId: context.cabinetId };
  }
  
  // ... autres méthodes
}
```

### 3. Création d'un Contrôleur
```typescript
@Controller('mon-endpoint')
export class MonController extends BaseCrudController<MonEntity, CreateDto, UpdateDto> {
  constructor(private readonly monService: MonService) {
    super(monService);
  }
  
  // Endpoints personnalisés
  @Get('statistics')
  @Roles('admin')
  async getStatistics(@CurrentUser() user: AuthenticatedUser) {
    const context = this.buildSecurityContext(user);
    return this.monService.getStatistics(context);
  }
}
```

## 📊 Avantages de l'Architecture

### ✅ Séparation des Responsabilités
- **Services** : Logique métier pure
- **Contrôleurs** : Gestion HTTP uniquement
- **Utils** : Fonctions utilitaires réutilisables

### ✅ Testabilité Maximale
- Services mockables facilement
- Tests unitaires isolés
- Injection de dépendances claire

### ✅ Type Safety Complète
- Génériques TypeScript
- Interfaces strictes
- Validation à la compilation

### ✅ Réutilisabilité
- Composition vs héritage
- Fonctionnalités modulaires
- Extensibilité facile

### ✅ Sécurité Intégrée
- Authentification automatique
- Autorisation par rôles
- Audit complet
- Équivalent RLS de Supabase

## 🔧 Configuration

### Variables d'Environnement
```env
# Pagination
DEFAULT_PAGE_LIMIT=20
MAX_PAGE_LIMIT=100

# Audit
AUDIT_ENABLED=true
AUDIT_SENSITIVE_FIELDS=password,token,secret

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_COUNT=100
```

### Module Configuration
Le module Common est configuré comme module global (`@Global()`) et exporte tous ses composants pour utilisation dans l'application.

## 📈 Métriques et Monitoring

### Logging
- Requêtes HTTP avec temps de réponse
- Erreurs avec stack traces (développement)
- Actions d'audit automatiques

### Health Checks
- Connexion base de données
- Statistiques de connexion
- Taille de la base de données

## 🔄 Migration depuis Supabase

### Équivalences
- **RLS Policies** → `buildSecurityConditions()`
- **Supabase Auth** → `@CurrentUser()` decorator
- **Supabase Filters** → `buildSearchConditions()`
- **Supabase Pagination** → `PaginationQueryDto`

### Compatibilité
L'architecture est spécialement conçue pour faciliter la migration depuis Supabase en conservant les mêmes concepts de sécurité et de filtrage.

## 🎯 Prochaines Étapes

1. **Implémentation des Modules Métier**
   - Contentieux
   - Recouvrement
   - Immobilier
   - Conseil

2. **Améliorations**
   - Cache Redis pour les requêtes fréquentes
   - Métriques Prometheus
   - Rate limiting avancé

3. **Tests**
   - Correction des tests PBT qui échouent
   - Tests d'intégration end-to-end
   - Tests de performance

## 📚 Documentation Technique

- **Spécifications** : `.kiro/specs/nestjs-api-architecture/`
- **Tests PBT** : `common.pbt.spec.ts`
- **Exemples** : `examples/affaires.service.example.ts`

---

*Ce module Common constitue la fondation de l'architecture NestJS CAPCO, fournissant tous les outils nécessaires pour développer rapidement et de manière cohérente les modules métier de l'application.*