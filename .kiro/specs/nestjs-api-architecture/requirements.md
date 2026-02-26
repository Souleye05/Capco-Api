# Document des Exigences - Architecture NestJS API CAPCO

## Introduction

L'API CAPCO est un système de gestion intégré pour un cabinet d'avocats spécialisé dans quatre domaines métier : contentieux, recouvrement, immobilier et conseil. Le système doit fournir une architecture NestJS modulaire, sécurisée et auditable avec environ 70 endpoints REST, basée sur le schéma Prisma existant migré depuis Supabase.

## Glossaire

- **API_CAPCO**: L'API NestJS pour la gestion du cabinet d'avocats CAPCO
- **Module_Métier**: Module NestJS organisé par domaine (contentieux, recouvrement, immobilier, conseil)
- **JWT_Auth**: Système d'authentification basé sur JSON Web Tokens
- **Audit_System**: Système de traçabilité automatique des actions utilisateur
- **DTO**: Data Transfer Object avec validation automatique
- **Guard**: Mécanisme de protection des endpoints (authentification et autorisation)
- **Reference_Generator**: Service de génération automatique de références métier
- **Prisma_Client**: Client ORM pour l'accès aux données PostgreSQL

## Exigences

### Exigence 1: Architecture Modulaire par Domaine

**User Story:** En tant qu'architecte système, je veux une architecture modulaire organisée par domaine métier, afin de maintenir une séparation claire des responsabilités et faciliter la maintenance.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL organize code into separate modules for each business domain (contentieux, recouvrement, immobilier, conseil)
2. WHEN a module is created, THE API_CAPCO SHALL include controller, service, and DTO files specific to that domain
3. THE API_CAPCO SHALL provide a common module containing shared decorators, guards, interceptors, filters, and pipes
4. THE API_CAPCO SHALL implement cross-cutting concerns (auth, users, dashboard, alertes, audit, storage) as separate modules
5. WHEN modules are imported, THE API_CAPCO SHALL maintain proper dependency injection and module boundaries

### Exigence 2: Système d'Authentification JWT avec Rôles

**User Story:** En tant qu'utilisateur du système, je veux un système d'authentification sécurisé avec gestion des rôles, afin de protéger l'accès aux données sensibles du cabinet.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement JWT-based authentication with token generation and validation
2. WHEN a user authenticates, THE API_CAPCO SHALL validate credentials against the User table and generate a JWT token
3. THE API_CAPCO SHALL support three user roles: admin, collaborateur, and compta as defined in AppRole enum
4. WHEN accessing protected endpoints, THE API_CAPCO SHALL validate JWT tokens and verify user roles
5. THE API_CAPCO SHALL implement role-based access control using Guards for endpoint protection
6. THE API_CAPCO SHALL store user roles in a separate UserRoles table with proper foreign key relationships

### Exigence 3: Audit Automatique des Actions

**User Story:** En tant qu'administrateur, je veux un système d'audit automatique, afin de tracer toutes les actions effectuées dans le système pour la conformité et la sécurité.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL automatically log all user actions using an AuditLogInterceptor
2. WHEN any CRUD operation is performed, THE API_CAPCO SHALL record the action in the AuditLog table
3. THE API_CAPCO SHALL capture user information (userId, userEmail), action type, module, entity details, and timestamp
4. THE API_CAPCO SHALL generate entity references automatically for audit trail purposes
5. THE API_CAPCO SHALL apply audit logging globally across all protected endpoints

### Exigence 4: Validation des Données avec DTOs

**User Story:** En tant que développeur, je veux une validation automatique des données d'entrée, afin de garantir l'intégrité des données et fournir des messages d'erreur clairs.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement DTOs for all request and response data structures
2. WHEN data is received, THE API_CAPCO SHALL validate it using class-validator decorators
3. THE API_CAPCO SHALL provide specific DTOs for create, update, and query operations for each entity
4. WHEN validation fails, THE API_CAPCO SHALL return structured error messages with field-specific details
5. THE API_CAPCO SHALL transform and sanitize input data automatically using class-transformer

### Exigence 5: Endpoints REST par Domaine Métier

**User Story:** En tant qu'utilisateur de l'API, je veux des endpoints REST organisés par domaine métier, afin d'accéder facilement aux fonctionnalités spécifiques de chaque domaine.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL provide CRUD endpoints for contentieux domain (affaires, audiences, honoraires, dépenses)
2. THE API_CAPCO SHALL provide CRUD endpoints for recouvrement domain (dossiers, actions, paiements, honoraires, dépenses)
3. THE API_CAPCO SHALL provide CRUD endpoints for immobilier domain (propriétaires, immeubles, lots, locataires, baux, encaissements, dépenses, rapports)
4. THE API_CAPCO SHALL provide CRUD endpoints for conseil domain (clients, tâches, factures, paiements)
5. THE API_CAPCO SHALL implement approximately 70 REST endpoints across all domains
6. WHEN endpoints are accessed, THE API_CAPCO SHALL return data in consistent JSON format with proper HTTP status codes

### Exigence 11: Gestion des Impayés et Arriérés Immobilier

**User Story:** En tant que gestionnaire immobilier, je veux un système automatique de détection et gestion des impayés et arriérés, afin de suivre efficacement les créances locatives et maintenir la rentabilité du patrimoine.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL automatically detect unpaid rents by comparing expected rents vs actual payments for each occupied lot
2. WHEN a lot has no payment recorded for a given month, THE API_CAPCO SHALL identify it as an unpaid rent (impayé)
3. THE API_CAPCO SHALL provide endpoints to query unpaid rents filtered by building and month
4. THE API_CAPCO SHALL manage rental arrears (arriérés) accumulated before January 2026 with dedicated storage
5. WHEN recording arrears, THE API_CAPCO SHALL allow partial payments and track remaining debt balance
6. THE API_CAPCO SHALL generate automatic alerts for unpaid rents using the existing LOYER_IMPAYE alert type
7. THE API_CAPCO SHALL provide statistics and reports on unpaid amounts by lot and building

### Exigence 12: Import Excel pour Module Immobilier

**User Story:** En tant qu'administrateur, je veux pouvoir importer en masse les données immobilières via des fichiers Excel, afin de migrer efficacement les données existantes et faciliter la saisie en volume.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL provide Excel import endpoints for proprietaires, immeubles, locataires, and lots
2. WHEN importing Excel files, THE API_CAPCO SHALL validate data format and business rules before processing
3. THE API_CAPCO SHALL provide downloadable Excel templates with required columns and validation rules
4. WHEN import validation fails, THE API_CAPCO SHALL return detailed error reports with line numbers and field-specific issues
5. THE API_CAPCO SHALL process imports transactionally to ensure data consistency
6. THE API_CAPCO SHALL support batch operations with progress tracking for large imports
7. THE API_CAPCO SHALL log all import operations in the audit system with file details and results

### Exigence 6: Génération Automatique de Références

**User Story:** En tant qu'utilisateur métier, je veux que le système génère automatiquement des références uniques pour les entités, afin de maintenir une numérotation cohérente et éviter les doublons.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement a Reference_Generator service for automatic reference generation
2. WHEN creating new entities (affaires, dossiers, clients), THE API_CAPCO SHALL generate unique references following business rules
3. THE API_CAPCO SHALL ensure reference uniqueness across the entire system
4. THE API_CAPCO SHALL format references according to domain-specific patterns (e.g., AFF-2024-001, DOS-REC-001)
5. THE API_CAPCO SHALL handle reference generation atomically to prevent race conditions

### Exigence 7: Gestion Centralisée des Erreurs

**User Story:** En tant que développeur frontend, je veux une gestion cohérente des erreurs, afin de pouvoir traiter les erreurs de manière uniforme dans l'interface utilisateur.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement a global exception filter for consistent error handling
2. WHEN errors occur, THE API_CAPCO SHALL return structured error responses with error codes and messages
3. THE API_CAPCO SHALL handle Prisma database errors and transform them into user-friendly messages
4. THE API_CAPCO SHALL log errors appropriately while protecting sensitive information
5. THE API_CAPCO SHALL provide different error detail levels based on environment (development vs production)

### Exigence 8: Configuration et Environnement

**User Story:** En tant qu'administrateur système, je veux une configuration flexible de l'application, afin de déployer l'API dans différents environnements avec des paramètres appropriés.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement configuration modules for database and JWT settings
2. WHEN the application starts, THE API_CAPCO SHALL load configuration from environment variables
3. THE API_CAPCO SHALL validate required configuration parameters at startup
4. THE API_CAPCO SHALL support different configuration profiles for development, staging, and production
5. THE API_CAPCO SHALL secure sensitive configuration values (database credentials, JWT secrets)

### Exigence 9: Intégration Prisma et Base de Données

**User Story:** En tant que développeur, je veux une intégration transparente avec Prisma, afin d'accéder aux données de manière type-safe et performante.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL implement a Prisma service for database connectivity
2. WHEN performing database operations, THE API_CAPCO SHALL use Prisma Client for type-safe queries
3. THE API_CAPCO SHALL handle database connections efficiently with connection pooling
4. THE API_CAPCO SHALL implement proper transaction handling for complex operations
5. THE API_CAPCO SHALL provide database health checks and monitoring capabilities

### Exigence 10: Documentation et Standards API

**User Story:** En tant que développeur frontend, je veux une documentation API complète, afin de comprendre et utiliser efficacement tous les endpoints disponibles.

#### Critères d'Acceptation

1. THE API_CAPCO SHALL generate automatic API documentation using Swagger/OpenAPI
2. WHEN endpoints are defined, THE API_CAPCO SHALL include comprehensive parameter and response documentation
3. THE API_CAPCO SHALL provide example requests and responses for all endpoints
4. THE API_CAPCO SHALL document authentication requirements and role permissions for each endpoint
5. THE API_CAPCO SHALL maintain consistent API versioning and deprecation policies