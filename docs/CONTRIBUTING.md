# 🤝 Guide de Contribution - CAPCO API

Merci de votre intérêt pour contribuer à l'API CAPCO ! Ce guide vous explique comment participer au développement du projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Workflow de Développement](#workflow-de-développement)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Signalement de Bugs](#signalement-de-bugs)
- [Demandes de Fonctionnalités](#demandes-de-fonctionnalités)

## 📜 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre [Code de Conduite](CODE_OF_CONDUCT.md). Nous nous engageons à maintenir un environnement accueillant et inclusif pour tous.

## 🚀 Comment Contribuer

### Types de Contributions

Nous accueillons tous types de contributions :

- 🐛 **Correction de bugs**
- ✨ **Nouvelles fonctionnalités**
- 📚 **Amélioration de la documentation**
- 🧪 **Ajout de tests**
- 🔧 **Optimisations de performance**
- 🎨 **Améliorations UX/UI**

### Avant de Commencer

1. **Vérifiez les issues existantes** pour éviter les doublons
2. **Discutez des changements majeurs** en créant une issue d'abord
3. **Lisez la documentation** pour comprendre l'architecture

## 🔄 Workflow de Développement

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub
# Puis cloner votre fork
git clone https://github.com/votre-username/capco-api.git
cd capco-api

# Ajouter le repository original comme remote
git remote add upstream https://github.com/original-username/capco-api.git
```

### 2. Configuration de l'Environnement

```bash
# Installer les dépendances
cd backend
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Configurer la base de données
npm run prisma:generate
npm run prisma:push
```

### 3. Créer une Branche

```bash
# Synchroniser avec upstream
git fetch upstream
git checkout main
git merge upstream/main

# Créer une branche pour votre contribution
git checkout -b feature/nom-de-la-fonctionnalite
# ou
git checkout -b fix/description-du-bug
```

### 4. Développement

```bash
# Démarrer en mode développement
npm run start:dev

# Lancer les tests en continu
npm run test:watch
```

### 5. Commits

Utilisez les **Conventional Commits** :

```bash
# Format : type(scope): description
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(common): resolve validation pipe error handling"
git commit -m "docs(api): update swagger documentation"
git commit -m "test(auth): add property-based tests for JWT"
```

**Types de commits :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring sans changement de fonctionnalité
- `test`: Ajout ou modification de tests
- `chore`: Maintenance, configuration

### 6. Tests et Validation

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:cov

# Tests property-based
npm test -- --testNamePattern="pbt"

# Tests end-to-end
npm run test:e2e

# Linting
npm run lint

# Formatage
npm run format
```

### 7. Pull Request

```bash
# Pousser votre branche
git push origin feature/nom-de-la-fonctionnalite

# Créer une Pull Request sur GitHub
```

## 📝 Standards de Code

### Style de Code

- **TypeScript strict** activé
- **ESLint** et **Prettier** configurés
- **Conventions de nommage** :
  - Fichiers : `kebab-case.ts`
  - Classes : `PascalCase`
  - Variables/fonctions : `camelCase`
  - Constantes : `UPPER_SNAKE_CASE`

### Architecture

- **Modules NestJS** pour l'organisation
- **Services abstraits** pour la réutilisabilité
- **DTOs** avec validation pour toutes les entrées
- **Interfaces TypeScript** pour la type safety
- **Décorateurs** pour les préoccupations transversales

### Exemple de Code

```typescript
// ✅ Bon exemple
@Injectable()
export class AffairesService extends BaseCrudService<
  Affaire,
  CreateAffaireDto,
  UpdateAffaireDto
> {
  protected modelName = 'affaire';
  protected searchFields = ['reference', 'intitule'];

  protected buildSecurityConditions(context: SecurityContext): any {
    return SecurityUtils.buildDefaultSecurityConditions(context);
  }

  async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.getNextSequenceNumber(year);
    return `AFF-${year}-${count.toString().padStart(3, '0')}`;
  }
}

// ❌ Mauvais exemple
@Injectable()
export class BadService {
  async create(data: any): Promise<any> { // Pas de types
    // Pas de validation
    return this.db.create(data); // Pas d'abstraction
  }
}
```

## 🧪 Tests

### Tests Obligatoires

Pour toute contribution, vous devez inclure :

1. **Tests unitaires** pour la logique métier
2. **Tests d'intégration** pour les endpoints
3. **Tests property-based** pour les propriétés universelles (si applicable)

### Exemple de Test

```typescript
describe('AffairesService', () => {
  let service: AffairesService;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AffairesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get(AffairesService);
    mockPrisma = module.get(PrismaService);
  });

  describe('generateReference', () => {
    it('should generate unique reference with correct format', async () => {
      mockPrisma.affaire.count.mockResolvedValue(5);

      const reference = await service.generateReference();

      expect(reference).toMatch(/^AFF-\d{4}-\d{3}$/);
      expect(reference).toBe(`AFF-${new Date().getFullYear()}-006`);
    });
  });
});
```

### Couverture de Tests

- **Minimum 80%** de couverture de code
- **100%** pour les nouvelles fonctionnalités critiques
- Tests des **cas d'erreur** obligatoires

## 📚 Documentation

### Documentation Obligatoire

1. **JSDoc** pour les fonctions publiques
2. **Swagger/OpenAPI** pour les endpoints
3. **README** pour les nouveaux modules
4. **Exemples d'usage** pour les fonctionnalités complexes

### Exemple de Documentation

```typescript
/**
 * Génère une référence unique pour une affaire
 * @param year - Année pour la référence (optionnel, défaut: année courante)
 * @returns Référence au format AFF-YYYY-XXX
 * @throws {Error} Si impossible de générer une référence unique
 * @example
 * ```typescript
 * const ref = await service.generateReference();
 * console.log(ref); // "AFF-2026-001"
 * ```
 */
async generateReference(year?: number): Promise<string> {
  // Implémentation
}
```

## 🐛 Signalement de Bugs

### Avant de Signaler

1. **Vérifiez** que le bug n'est pas déjà signalé
2. **Reproduisez** le bug de manière consistante
3. **Testez** sur la dernière version

### Template de Bug Report

```markdown
## 🐛 Description du Bug
Description claire et concise du problème.

## 🔄 Étapes pour Reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Faire défiler jusqu'à '...'
4. Voir l'erreur

## ✅ Comportement Attendu
Description de ce qui devrait se passer.

## ❌ Comportement Actuel
Description de ce qui se passe réellement.

## 📱 Environnement
- OS: [ex: Windows 11]
- Node.js: [ex: 18.17.0]
- Version API: [ex: 1.2.0]
- Base de données: [ex: PostgreSQL 15.3]

## 📎 Informations Supplémentaires
- Logs d'erreur
- Screenshots
- Configuration spéciale
```

## ✨ Demandes de Fonctionnalités

### Template de Feature Request

```markdown
## 🚀 Fonctionnalité Demandée
Description claire de la fonctionnalité souhaitée.

## 🎯 Problème à Résoudre
Quel problème cette fonctionnalité résout-elle ?

## 💡 Solution Proposée
Description détaillée de la solution envisagée.

## 🔄 Alternatives Considérées
Autres solutions envisagées et pourquoi elles ne conviennent pas.

## 📋 Critères d'Acceptation
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

## 🎨 Maquettes/Exemples
Maquettes, diagrammes, ou exemples de code si applicable.
```

## 🏷️ Labels GitHub

Nous utilisons ces labels pour organiser les issues :

- `bug` - Problème à corriger
- `enhancement` - Nouvelle fonctionnalité
- `documentation` - Amélioration de la doc
- `good first issue` - Bon pour débuter
- `help wanted` - Aide recherchée
- `priority: high` - Priorité élevée
- `priority: low` - Priorité faible
- `module: auth` - Module authentification
- `module: common` - Module common
- `module: contentieux` - Module contentieux

## 🎉 Reconnaissance

Les contributeurs sont reconnus dans :

- **README.md** - Section contributeurs
- **CHANGELOG.md** - Mentions dans les releases
- **GitHub** - Profil de contributeur

## 📞 Support

Besoin d'aide ? Contactez-nous :

- **Discord** : [Serveur de développement](https://discord.gg/capco-dev)
- **Email** : dev@capco-api.com
- **Issues** : [GitHub Issues](https://github.com/votre-username/capco-api/issues)

## 📋 Checklist PR

Avant de soumettre votre PR, vérifiez :

- [ ] Code respecte les standards du projet
- [ ] Tests ajoutés et passent tous
- [ ] Documentation mise à jour
- [ ] Commits suivent les conventions
- [ ] Pas de conflits avec main
- [ ] Description PR claire et complète
- [ ] Issues liées référencées

---

🙏 **Merci de contribuer à CAPCO API !** Votre aide est précieuse pour améliorer l'outil.