# CAPCOS - Gestion de Cabinet Juridique

## Description

CAPCOS est une application de gestion performante conçue pour les avocats et les cabinets juridiques. Elle permet de gérer les affaires, les audiences, l'agenda et les rappels de manière centralisée et intuitive.

## Technologies Utilisées

Ce projet est construit avec les technologies modernes suivantes :

- **Vite** : Outil de construction rapide pour le frontend.
- **TypeScript** : Langage de programmation typé pour une meilleure maintenabilité.
- **React** : Bibliothèque pour la construction d'interfaces utilisateur.
- **shadcn-ui** : Composants d'interface utilisateur réutilisables et accessibles.
- **Tailwind CSS** : Framework CSS utilitaire pour un design moderne et responsive.
- **TanStack Query** : Gestion de l'état asynchrone et du cache des données.
- **Framer Motion** : Bibliothèque pour les animations premium.

## Installation Locale

Pour lancer le projet localement sur votre machine, suivez ces étapes :

1.  **Cloner le dépôt**
    ```sh
    git clone <votre_url_de_repo>
    cd CAPCOS
    ```

2.  **Installer les dépendances**
    ```sh
    npm install
    ```

3.  **Lancer le serveur de développement**
    ```sh
    npm run dev
    ```

L'application sera accessible par défaut sur `http://localhost:8080`.

## Scripts Disponibles

- `npm run dev` : Lance le serveur de développement.
- `npm run build` : Génère le build de production dans le dossier `dist`.
- `npm run preview` : Lance un serveur local pour prévisualiser le build de production.
- `npm run lint` : Vérifie la qualité du code avec ESLint.

## Structure du Projet

L'architecture suit les meilleures pratiques de développement React :

- `src/components` : Composants UI réutilisables.
- `src/pages` : Pages principales de l'application.
- `src/hooks` : Hooks personnalisés pour la logique métier.
- `src/services` : Appels API et services externes.
- `src/utils` : Fonctions utilitaires globales.
- `src/types` : Définitions de types TypeScript.
