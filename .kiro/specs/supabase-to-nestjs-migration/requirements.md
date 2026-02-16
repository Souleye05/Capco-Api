# Requirements Document - Migration Supabase vers NestJS

## Introduction

Ce document définit les exigences pour migrer une application React/TypeScript existante de Supabase vers une architecture backend personnalisée utilisant NestJS et PostgreSQL. Cette migration complète de niveau entreprise inclut la migration de TOUTES les données utilisateur réelles, la migration des utilisateurs depuis auth.users, la migration de tous les fichiers stockés, et des garanties de sécurité de niveau production avec capacité de rollback complète. L'objectif est de créer un système de production robuste avec préservation complète des données existantes, validation d'intégrité, et capacité de récupération en cas d'échec.

**CRITIQUE** : Cette migration concerne des DONNÉES UTILISATEUR RÉELLES en production. Aucune perte de données n'est acceptable. Tous les systèmes de sécurité, validation, et rollback sont obligatoires.

## Glossary

- **Frontend_App**: L'application React/TypeScript existante
- **Supabase_Client**: Le client Supabase actuellement utilisé (@supabase/supabase-js)
- **NestJS_API**: La nouvelle API backend à créer avec NestJS
- **PostgreSQL_DB**: La nouvelle base de données PostgreSQL avec données migrées
- **Prisma_ORM**: L'ORM Prisma pour la gestion de la base de données
- **Auth_Module**: Le module d'authentification NestJS avec migration des utilisateurs
- **Storage_Module**: Le module de gestion des fichiers NestJS avec migration des fichiers
- **Schema_Extractor**: Script pour extraire le schéma depuis les migrations Supabase
- **Data_Migrator**: Script pour migrer toutes les données depuis Supabase
- **User_Migrator**: Script pour migrer les utilisateurs depuis auth.users
- **File_Migrator**: Script pour migrer les fichiers depuis Supabase Storage
- **Migration_Validator**: Outil de validation de l'intégrité des données migrées avec vérification complète
- **Rollback_System**: Système de rollback complet en cas d'échec de migration
- **Backup_System**: Système de sauvegarde complète avant migration
- **Integrity_Checker**: Vérificateur d'intégrité des données avec validation checksums
- **Progress_Monitor**: Moniteur de progression en temps réel avec alertes
- **Audit_Logger**: Système de journalisation complète pour audit et traçabilité

## Requirements

### Requirement 1: Complete Database Schema Extraction and Full Data Migration

**User Story:** En tant que développeur, je veux extraire le schéma de base de données depuis les migrations Supabase et migrer TOUTES les données utilisateur réelles existantes, afin de créer une nouvelle base de données PostgreSQL avec la même structure et la préservation complète de toutes les données de production.

#### Acceptance Criteria

1. WHEN analyzing the Supabase migrations, THE Schema_Extractor SHALL extract all public schema tables and their relationships with complete metadata
2. WHEN generating the Prisma schema, THE Schema_Extractor SHALL create equivalent models for all identified tables (affaires, audiences, dossiers_recouvrement, etc.) with identical constraints
3. WHEN creating the schema, THE Schema_Extractor SHALL preserve all enum types (statut_affaire, type_action, mode_paiement, etc.) and custom data types
4. THE Schema_Extractor SHALL exclude all Supabase internal schemas (auth, storage, realtime, extensions) while preserving all business data
5. WHEN exporting data, THE Data_Migrator SHALL export ALL REAL USER DATA from public schema tables preserving UUIDs, timestamps, and complete referential integrity
6. WHEN importing data, THE Data_Migrator SHALL import all exported production data into the new PostgreSQL database maintaining all relationships and constraints
7. THE Migration_Validator SHALL verify complete data integrity after migration by comparing record counts, checksums, and validating all key relationships
8. WHEN migration completes, THE Data_Migrator SHALL generate comprehensive migration reports showing exact counts of migrated records per table
9. THE Data_Migrator SHALL implement transaction-safe import with automatic rollback on any data integrity violation

### Requirement 2: Complete User Migration from auth.users with Security

**User Story:** En tant qu'utilisateur existant, je veux que mon compte soit migré depuis Supabase auth.users vers le nouveau système avec toutes mes données et permissions, afin de conserver mon accès complet sans recréer de compte et sans perte d'historique.

#### Acceptance Criteria

1. WHEN migrating users, THE User_Migrator SHALL export ALL users from auth.users table with complete metadata, profiles, and authentication history
2. WHEN creating new users, THE User_Migrator SHALL preserve exact user IDs, emails, creation timestamps, and all user metadata from Supabase
3. WHEN handling passwords, THE User_Migrator SHALL implement secure password migration strategy with either hash migration or mandatory secure password reset flow
4. WHEN migrating roles, THE User_Migrator SHALL preserve ALL user roles and permissions from existing system including custom role assignments
5. THE User_Migrator SHALL create complete mapping between old auth.users IDs and new user table IDs for data integrity
6. WHEN migration completes, THE Auth_Module SHALL authenticate ALL migrated users with the new JWT system maintaining session continuity
7. THE User_Migrator SHALL generate detailed migration report showing successful migrations, failed migrations, and users requiring password reset
8. WHEN users first login post-migration, THE Auth_Module SHALL handle password reset flow seamlessly for users with temporary passwords
9. THE User_Migrator SHALL preserve user email verification status, last sign-in dates, and all authentication-related metadata

### Requirement 3: Complete File Storage Migration with Integrity Validation

**User Story:** En tant qu'utilisateur, je veux que TOUS mes fichiers stockés dans Supabase Storage soient migrés vers le nouveau système avec validation d'intégrité complète, afin de conserver l'accès à tous mes documents existants sans aucune perte de données.

#### Acceptance Criteria

1. WHEN exporting files, THE File_Migrator SHALL download ALL files from ALL Supabase Storage buckets with complete metadata preservation
2. WHEN organizing files, THE File_Migrator SHALL preserve the exact original folder structure, file names, and directory hierarchy
3. WHEN migrating storage, THE File_Migrator SHALL support both local storage and S3-compatible storage as destination with seamless switching capability
4. WHEN updating references, THE File_Migrator SHALL update ALL database file references to point to new storage locations while maintaining backward compatibility
5. THE File_Migrator SHALL preserve complete file metadata including upload date, size, type, permissions, and original bucket information
6. WHEN migration completes, THE Storage_Module SHALL serve ALL migrated files with proper authentication and access control equivalent to original system
7. THE File_Migrator SHALL generate comprehensive migration report with exact file counts, total sizes, migration success rates, and detailed failure analysis
8. THE File_Migrator SHALL implement checksum validation for every migrated file to ensure complete data integrity
9. WHEN file migration fails, THE File_Migrator SHALL implement retry logic with exponential backoff and detailed error logging
10. THE File_Migrator SHALL create complete audit trail of all file operations for compliance and troubleshooting

### Requirement 4: Enterprise-Grade Production Safety and Complete Rollback Capability

**User Story:** En tant qu'administrateur système, je veux des garanties de sécurité de niveau entreprise avec capacité de rollback complète et points de contrôle incrémentaux, afin de pouvoir revenir en arrière à tout moment en cas de problème lors de la migration sans aucune perte de données.

#### Acceptance Criteria

1. WHEN starting migration, THE Migration_System SHALL create complete backup of ALL current Supabase data including database, auth.users, and storage files
2. WHEN migration fails at any point, THE Rollback_System SHALL restore the original Supabase configuration and ALL data to exact pre-migration state
3. WHEN validating migration, THE Migration_Validator SHALL perform comprehensive data integrity checks including record counts, checksums, and relationship validation
4. THE Migration_System SHALL implement incremental checkpoints at each major phase allowing granular rollback to specific migration stages
5. WHEN errors occur, THE Migration_System SHALL log detailed error information with stack traces, data context, and suggested remediation steps
6. THE Migration_System SHALL provide real-time progress reporting with ETA calculations and detailed status updates during migration process
7. WHEN migration completes, THE Migration_System SHALL generate comprehensive audit trail and migration report with complete statistics and validation results
8. THE Rollback_System SHALL validate rollback capability before starting migration by testing backup restoration procedures
9. THE Migration_System SHALL implement automatic rollback triggers for critical failures including data corruption or integrity violations
10. THE Migration_System SHALL maintain complete transaction logs for forensic analysis and compliance requirements

### Requirement 5: Comprehensive Data Validation and Integrity Verification

**User Story:** En tant qu'administrateur, je veux des vérifications complètes et automatisées de l'intégrité des données avec validation en temps réel, afin de garantir que toutes les données ont été migrées correctement sans aucune corruption ou perte.

#### Acceptance Criteria

1. WHEN validating data, THE Migration_Validator SHALL compare exact record counts between source and destination for every table with detailed discrepancy reporting
2. WHEN checking integrity, THE Migration_Validator SHALL verify ALL foreign key relationships are preserved with complete referential integrity validation
3. WHEN validating UUIDs, THE Migration_Validator SHALL ensure ALL UUID references remain consistent across all tables and relationships
4. THE Migration_Validator SHALL verify that ALL enum values are correctly migrated with no data loss or corruption
5. WHEN checking files, THE Migration_Validator SHALL verify file checksums match exactly between source and destination for every migrated file
6. THE Migration_Validator SHALL validate that ALL user accounts can authenticate in the new system with preserved permissions and roles
7. WHEN validation fails, THE Migration_Validator SHALL provide detailed reports of discrepancies with specific record IDs and suggested remediation steps
8. THE Migration_Validator SHALL implement automated validation tests that run continuously during migration process
9. THE Migration_Validator SHALL validate data type consistency and constraint preservation across all migrated tables
10. THE Migration_Validator SHALL generate comprehensive validation reports with statistical analysis and confidence metrics

### Requirement 6: API Endpoints with Migrated Data Compatibility

**User Story:** En tant que développeur frontend, je veux des endpoints REST compatibles avec les requêtes actuelles et les données migrées, afin de minimiser les changements dans le frontend tout en préservant toutes les données existantes.

#### Acceptance Criteria

1. WHEN creating CRUD endpoints, THE NestJS_API SHALL provide REST endpoints for all migrated Supabase tables
2. WHEN handling requests, THE NestJS_API SHALL implement the same data validation as current Supabase RLS policies
3. WHEN returning data, THE NestJS_API SHALL maintain the same JSON structure as current Supabase responses
4. THE NestJS_API SHALL implement pagination, filtering, and sorting capabilities equivalent to current Supabase queries
5. WHEN serving migrated data, THE NestJS_API SHALL maintain all existing relationships and data integrity
6. WHEN errors occur, THE NestJS_API SHALL return consistent error responses with appropriate HTTP status codes
7. THE NestJS_API SHALL handle all migrated file references correctly with proper authentication

### Requirement 7: Authentication System with Migrated Users

**User Story:** En tant qu'utilisateur migré, je veux pouvoir m'authentifier avec mes identifiants existants via la nouvelle API NestJS, afin d'accéder à l'application sans interruption de service.

#### Acceptance Criteria

1. WHEN a migrated user logs in, THE Auth_Module SHALL authenticate using the new JWT system
2. WHEN handling passwords, THE Auth_Module SHALL support both migrated password hashes and new password resets
3. WHEN accessing protected routes, THE Auth_Module SHALL validate JWT tokens using a JWT Guard
4. WHEN a user's session expires, THE Auth_Module SHALL require re-authentication with proper error messaging
5. THE Auth_Module SHALL implement role-based access control preserving all existing user permissions
6. WHEN user data is accessed, THE Auth_Module SHALL maintain all existing user relationships and metadata
7. THE Auth_Module SHALL provide secure password reset functionality for migrated users

### Requirement 8: File Storage System with Migrated Files

**User Story:** En tant qu'utilisateur, je veux accéder à tous mes fichiers existants via la nouvelle API avec le même niveau de sécurité, afin de continuer à utiliser tous mes documents sans interruption.

#### Acceptance Criteria

1. WHEN serving files, THE Storage_Module SHALL provide access to all migrated files with proper authentication
2. WHEN uploading new files, THE Storage_Module SHALL accept multipart/form-data requests using Multer
3. WHEN storing files, THE Storage_Module SHALL support both local storage and S3-compatible storage
4. THE Storage_Module SHALL maintain all migrated file metadata (name, size, type, upload date, permissions)
5. WHEN accessing files, THE Storage_Module SHALL implement the same security controls as the original system
6. WHEN deleting files, THE Storage_Module SHALL remove both file data and database references
7. THE Storage_Module SHALL provide file versioning and backup capabilities for production safety

### Requirement 9: Frontend Integration with Migrated Data

**User Story:** En tant que développeur, je veux adapter le frontend pour utiliser la nouvelle API avec toutes les données migrées, afin de supprimer complètement la dépendance Supabase tout en préservant toutes les fonctionnalités existantes.

#### Acceptance Criteria

1. WHEN removing Supabase, THE Frontend_App SHALL uninstall @supabase/supabase-js dependency
2. WHEN making API calls, THE Frontend_App SHALL replace all supabase.from() calls with axios/fetch requests to NestJS_API
3. WHEN handling authentication, THE Frontend_App SHALL replace supabase.auth calls with JWT-based authentication
4. WHEN uploading files, THE Frontend_App SHALL send FormData to Storage_Module endpoints instead of supabase.storage
5. THE Frontend_App SHALL implement proper error handling for the new API responses
6. WHEN displaying data, THE Frontend_App SHALL work seamlessly with all migrated data
7. THE Frontend_App SHALL maintain all existing user workflows and functionality

### Requirement 10: Production Environment and Monitoring

**User Story:** En tant qu'administrateur système, je veux un environnement de production robuste avec monitoring complet, afin de garantir la stabilité et la performance du système migré.

#### Acceptance Criteria

1. THE NestJS_API SHALL include Docker configuration for production PostgreSQL database
2. THE NestJS_API SHALL include environment configuration for development, staging, and production
3. WHEN starting production, THE NestJS_API SHALL automatically validate database integrity and connections
4. THE NestJS_API SHALL include comprehensive logging for debugging, monitoring, and audit trails
5. THE NestJS_API SHALL include health check endpoints for monitoring system status
6. WHEN handling load, THE NestJS_API SHALL implement connection pooling and performance optimization
7. THE NestJS_API SHALL include alerting and monitoring for production issues

### Requirement 11: Comprehensive Testing Strategy

**User Story:** En tant que développeur, je veux une suite de tests complète couvrant la migration et le nouveau système, afin de garantir la qualité et la fiabilité avec les données migrées.

#### Acceptance Criteria

1. THE Migration_System SHALL include property-based tests for data migration integrity
2. THE NestJS_API SHALL include unit tests for all service methods and controllers with migrated data
3. THE NestJS_API SHALL include integration tests for database operations with real migrated data
4. THE NestJS_API SHALL include end-to-end tests for critical user workflows with migrated data
5. THE Frontend_App SHALL include tests for the new API integration with migrated data scenarios
6. THE Migration_System SHALL include rollback tests to verify recovery capabilities
7. THE Testing_Suite SHALL include performance tests to ensure system scalability with production data

### Requirement 12: Security and Performance with Production Data

**User Story:** En tant qu'utilisateur, je veux que la nouvelle architecture soit performante et sécurisée avec toutes mes données migrées, afin de maintenir une expérience utilisateur optimale et sécurisée.

#### Acceptance Criteria

1. WHEN handling requests, THE NestJS_API SHALL implement request rate limiting to prevent abuse
2. WHEN storing sensitive data, THE NestJS_API SHALL encrypt passwords and sensitive information using industry standards
3. WHEN serving files, THE Storage_Module SHALL implement proper access controls equivalent to original system
4. THE NestJS_API SHALL implement database connection pooling for optimal performance with production data volumes
5. WHEN logging actions, THE NestJS_API SHALL maintain comprehensive audit trails for all operations
6. THE Security_System SHALL implement data encryption at rest and in transit
7. THE Performance_System SHALL handle production data volumes without degradation

### Requirement 13: Documentation and Deployment with Migration Procedures

**User Story:** En tant que développeur, je veux une documentation complète incluant les procédures de migration, afin de faciliter la maintenance, le déploiement et les futures migrations.

#### Acceptance Criteria

1. THE NestJS_API SHALL include OpenAPI/Swagger documentation for all endpoints
2. THE Migration_System SHALL include comprehensive step-by-step migration procedures
3. THE Migration_System SHALL include rollback procedures and troubleshooting guides
4. THE NestJS_API SHALL include deployment guides for different environments with migrated data
5. THE Frontend_App SHALL include updated README with new setup instructions and migration notes
6. THE Documentation SHALL include data validation procedures and integrity check instructions
7. THE Documentation SHALL include monitoring and alerting setup for production environments