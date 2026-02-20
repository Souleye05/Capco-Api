# Plan d'Implémentation : Architecture NestJS API CAPCO

## Vue d'Ensemble

Ce plan d'implémentation transforme la conception de l'API CAPCO en une série de tâches de développement incrémentales. L'approche suit une stratégie de construction par couches : infrastructure de base, authentification, modules métier, puis intégration finale. Chaque tâche construit sur les précédentes et se termine par l'intégration complète du système.

## Tâches

- [x] 1. Configuration de base et infrastructure
  - Configurer la structure de projet NestJS avec TypeScript
  - Installer et configurer Prisma avec le schéma existant
  - Configurer les modules de configuration (database.config.ts, jwt.config.ts)
  - Mettre en place les variables d'environnement et validation
  - _Exigences: 8.1, 8.2, 8.3, 9.1_

- [ ] 2. Module Common et services transversaux
  - [x] 2.1 Créer le module Common avec les éléments partagés
    - Implémenter les guards (JwtAuthGuard, RolesGuard)
    - Créer les interceptors (AuditLogInterceptor, TransformInterceptor)
    - Développer les pipes (ValidationPipe, ParseUUIDPipe)
    - Implémenter les filtres d'exception (AllExceptionsFilter, PrismaExceptionFilter)
    - Créer les décorateurs (@Roles, @CurrentUser, @AuditLog)
    - _Exigences: 1.3, 7.1, 7.2, 7.3_

  - [x] 2.2 Écrire les tests de propriété pour le module Common
    - **Propriété 14: Gestion cohérente des erreurs**
    - **Valide: Exigences 7.2**

  - [x] 2.3 Implémenter le service PrismaService
    - Configurer la connexion à la base de données
    - Implémenter la gestion des connexions et pooling
    - Ajouter les health checks de base de données
    - _Exigences: 9.1, 9.3, 9.5_

  - [x] 2.4 Écrire les tests de propriété pour PrismaService
    - **Propriété 20: Opérations de base de données type-safe**
    - **Valide: Exigences 9.2**

- [ ] 3. Système d'authentification et utilisateurs
  - [x] 3.1 Créer le module Auth
    - Implémenter AuthService avec login, validation, génération de tokens
    - Créer AuthController avec endpoints de connexion/déconnexion
    - Configurer les stratégies Passport (JwtStrategy, LocalStrategy)
    - Implémenter la gestion des refresh tokens
    - _Exigences: 2.1, 2.2_

  - [ ]* 3.2 Écrire les tests de propriété pour l'authentification
    - **Propriété 3: Authentification JWT round-trip**
    - **Valide: Exigences 2.1, 2.2**

  - [x] 3.3 Créer le module Users
    - Implémenter UsersService avec CRUD complet
    - Créer UsersController avec endpoints de gestion des utilisateurs
    - Implémenter la gestion des rôles (assignation, suppression)
    - Créer les DTOs pour les utilisateurs (CreateUserDto, UpdateUserDto, etc.)
    - _Exigences: 2.3, 2.6_

  - [ ]* 3.4 Écrire les tests de propriété pour la protection des endpoints
    - **Propriété 4: Protection des endpoints par rôles**
    - **Valide: Exigences 2.4, 2.5**

- [x] 4. Service de génération de références
  - [x] 4.1 Implémenter ReferenceGeneratorService
    - Créer la logique de génération de références par domaine
    - Implémenter la vérification d'unicité
    - Gérer la concurrence et les conditions de course
    - _Exigences: 6.1, 6.4, 6.5_

  - [x] 4.2 Écrire les tests de propriété pour la génération de références
    - **Propriété 12: Unicité globale des références**
    - **Propriété 13: Génération atomique des références**
    - **Valide: Exigences 6.2, 6.3, 6.4, 6.5**

- [ ] 5. Système d'audit
  - [x] 5.1 Créer le module Audit
    - Implémenter AuditService pour la gestion des logs
    - Créer AuditController pour la consultation des logs
    - Configurer l'AuditLogInterceptor global
    - Créer les DTOs d'audit (CreateAuditLogDto, AuditQueryDto)
    - _Exigences: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Écrire les tests de propriété pour l'audit automatique
    - **Propriété 5: Audit automatique des actions**
    - **Propriété 6: Génération automatique de références d'audit**
    - **Propriété 7: Application globale de l'audit**
    - **Valide: Exigences 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 6. Checkpoint - Infrastructure de base
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [-] 7. Module Contentieux
  - [x] 7.1 Créer les entités et DTOs du contentieux
    - Créer les DTOs pour Affaires (CreateAffaireDto, UpdateAffaireDto, AffaireResponseDto)
    - Créer les DTOs pour Audiences (CreateAudienceDto, UpdateAudienceDto, etc.)
    - Créer les DTOs pour HonorairesContentieux et DepensesAffaires
    - Implémenter la validation avec class-validator
    - _Exigences: 4.1, 4.3_

  - [ ] 7.2 Implémenter ContentieuxService
    - Créer AffairesService avec CRUD complet
    - Créer AudiencesService avec gestion des résultats
    - Créer HonorairesContentieuxService et DepensesAffairesService
    - Intégrer la génération automatique de références
    - _Exigences: 5.1, 6.2_

  - [ ] 7.3 Créer ContentieuxController
    - Implémenter tous les endpoints CRUD pour les affaires
    - Implémenter les endpoints pour audiences et résultats
    - Implémenter les endpoints pour honoraires et dépenses
    - Appliquer les guards d'authentification et de rôles
    - _Exigences: 5.1, 2.4, 2.5_

  - [ ]* 7.4 Écrire les tests de propriété pour le module Contentieux
    - **Propriété 8: Validation des données d'entrée**
    - **Propriété 10: Endpoints CRUD complets par domaine**
    - **Valide: Exigences 4.2, 4.4, 5.1**

- [ ] 8. Module Recouvrement
  - [ ] 8.1 Créer les entités et DTOs du recouvrement
    - Créer les DTOs pour DossiersRecouvrement avec validation complète
    - Créer les DTOs pour ActionsRecouvrement, PaiementsRecouvrement
    - Créer les DTOs pour HonorairesRecouvrement et DepensesDossier
    - _Exigences: 4.1, 4.3_

  - [ ] 8.2 Implémenter RecouvrementService
    - Créer DossiersRecouvrementService avec logique métier
    - Créer ActionsRecouvrementService et PaiementsRecouvrementService
    - Implémenter la gestion des relations avec les parties
    - Intégrer la génération de références automatique
    - _Exigences: 5.2, 6.2_

  - [ ] 8.3 Créer RecouvrementController
    - Implémenter tous les endpoints CRUD pour les dossiers
    - Implémenter les endpoints pour actions et paiements
    - Gérer les relations avec les locataires via LocatairesDossiersRecouvrement
    - _Exigences: 5.2_

  - [ ]* 8.4 Écrire les tests de propriété pour le module Recouvrement
    - **Propriété 21: Gestion transactionnelle des opérations complexes**
    - **Valide: Exigences 9.4**

- [ ] 9. Module Immobilier
  - [ ] 9.1 Créer les entités et DTOs de l'immobilier
    - Créer les DTOs pour Proprietaires, Immeubles, Lots
    - Créer les DTOs pour Locataires, Baux, EncaissementsLoyers
    - Créer les DTOs pour DepensesImmeubles et RapportsGestion
    - _Exigences: 4.1, 4.3_

  - [ ] 9.2 Implémenter ImmobilierService
    - Créer ProprietairesService et ImmeublesService
    - Créer LotsService et LocatairesService avec gestion des relations
    - Créer BauxService et EncaissementsService
    - Implémenter RapportsGestionService avec calculs automatiques
    - _Exigences: 5.3_

  - [ ] 9.3 Créer ImmobilierController
    - Implémenter tous les endpoints CRUD pour le patrimoine immobilier
    - Gérer les relations complexes entre entités
    - Implémenter les endpoints de génération de rapports
    - _Exigences: 5.3_

  - [ ]* 9.4 Écrire les tests de propriété pour le module Immobilier
    - **Propriété 9: Transformation automatique des données**
    - **Valide: Exigences 4.5**

- [ ] 10. Module Conseil
  - [ ] 10.1 Créer les entités et DTOs du conseil
    - Créer les DTOs pour ClientsConseil avec validation
    - Créer les DTOs pour TachesConseil et FacturesConseil
    - Créer les DTOs pour PaiementsConseil
    - _Exigences: 4.1, 4.3_

  - [ ] 10.2 Implémenter ConseilService
    - Créer ClientsConseilService avec gestion du statut
    - Créer TachesConseilService et FacturesConseilService
    - Implémenter la logique de facturation automatique
    - Intégrer la génération de références de factures
    - _Exigences: 5.4, 6.2_

  - [ ] 10.3 Créer ConseilController
    - Implémenter tous les endpoints CRUD pour les clients conseil
    - Implémenter les endpoints de gestion des tâches et facturation
    - _Exigences: 5.4_

  - [ ]* 10.4 Écrire les tests de propriété pour le module Conseil
    - **Propriété 11: Cohérence des réponses API**
    - **Valide: Exigences 5.6**

- [ ] 11. Modules de support
  - [ ] 11.1 Créer le module Dashboard
    - Implémenter DashboardService avec agrégation de données
    - Créer DashboardController avec endpoints de statistiques
    - Implémenter les calculs de KPIs par domaine métier
    - _Exigences: 1.4_

  - [ ] 11.2 Créer le module Alertes
    - Implémenter AlertesService avec logique de génération d'alertes
    - Créer AlertesController pour la gestion des alertes
    - Implémenter les différents types d'alertes métier
    - _Exigences: 1.4_

  - [ ] 11.3 Créer le module Storage
    - Implémenter StorageService pour la gestion des fichiers
    - Créer StorageController pour upload/download
    - Gérer les justificatifs et pièces jointes
    - _Exigences: 1.4_

- [ ] 12. Checkpoint - Modules métier
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 13. Configuration avancée et sécurité
  - [ ] 13.1 Configurer la gestion d'erreurs avancée
    - Implémenter les filtres d'exception spécialisés
    - Configurer les niveaux d'erreur par environnement
    - Implémenter la protection des informations sensibles
    - _Exigences: 7.4, 7.5_

  - [ ]* 13.2 Écrire les tests de propriété pour la gestion d'erreurs
    - **Propriété 15: Transformation des erreurs Prisma**
    - **Propriété 16: Protection des informations sensibles dans les logs**
    - **Propriété 17: Niveaux d'erreur par environnement**
    - **Valide: Exigences 7.3, 7.4, 7.5**

  - [ ] 13.3 Configurer la sécurité avancée
    - Implémenter la validation de configuration au démarrage
    - Sécuriser les valeurs de configuration sensibles
    - Configurer les profils d'environnement
    - _Exigences: 8.4, 8.5_

  - [ ]* 13.4 Écrire les tests de propriété pour la configuration
    - **Propriété 18: Chargement de configuration au démarrage**
    - **Propriété 19: Sécurisation des valeurs de configuration**
    - **Valide: Exigences 8.2, 8.3, 8.5**

- [ ] 14. Documentation API
  - [ ] 14.1 Configurer Swagger/OpenAPI
    - Installer et configurer @nestjs/swagger
    - Ajouter les décorateurs Swagger sur tous les endpoints
    - Configurer les schémas de sécurité JWT
    - _Exigences: 10.1_

  - [ ] 14.2 Enrichir la documentation API
    - Ajouter des exemples de requêtes et réponses
    - Documenter les exigences d'authentification par endpoint
    - Implémenter le versioning et les politiques de dépréciation
    - _Exigences: 10.2, 10.3, 10.4, 10.5_

  - [ ]* 14.3 Écrire les tests de propriété pour la documentation
    - **Propriété 22: Documentation complète des endpoints**
    - **Propriété 23: Exemples de documentation**
    - **Propriété 24: Documentation de sécurité**
    - **Propriété 25: Cohérence du versioning API**
    - **Valide: Exigences 10.2, 10.3, 10.4, 10.5**

- [ ] 15. Intégration et câblage final
  - [ ] 15.1 Intégrer tous les modules dans AppModule
    - Configurer l'importation de tous les modules
    - Appliquer les guards et interceptors globalement
    - Configurer les middlewares et filtres
    - _Exigences: 1.1, 1.5_

  - [ ]* 15.2 Écrire les tests de propriété pour l'intégration
    - **Propriété 1: Cohérence de la structure modulaire**
    - **Propriété 2: Injection de dépendances modulaire**
    - **Valide: Exigences 1.2, 1.5**

  - [ ] 15.3 Configurer l'application principale
    - Configurer main.ts avec tous les pipes, guards et filtres globaux
    - Implémenter la validation de configuration au démarrage
    - Configurer les CORS et autres middlewares de sécurité
    - _Exigences: 8.2, 8.3_

- [ ] 16. Tests d'intégration et validation finale
  - [ ]* 16.1 Écrire les tests d'intégration end-to-end
    - Tester les flux complets d'authentification
    - Tester les opérations CRUD sur tous les domaines
    - Tester l'audit automatique sur les opérations réelles
    - _Exigences: 2.1, 5.1, 5.2, 5.3, 5.4, 3.1_

  - [ ]* 16.2 Valider les 70 endpoints REST
    - Vérifier que tous les endpoints requis sont implémentés
    - Tester la cohérence des réponses API
    - Valider la documentation Swagger complète
    - _Exigences: 5.5, 5.6, 10.1_

- [ ] 17. Checkpoint final - S'assurer que tous les tests passent
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence des exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
- Les tests unitaires valident des exemples spécifiques et des cas limites
- L'architecture modulaire permet un développement parallèle des domaines métier