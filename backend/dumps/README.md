# 📦 Dossier des Dumps de Base de Données

Ce dossier contient les dumps de la base de données créés par les scripts automatisés.

## 🎯 Utilisation

### Créer un Dump

```bash
# Windows
npm run db:dump:win

# Linux/Mac
npm run db:dump
```

### Restaurer un Dump

```bash
# Windows
npm run db:restore:win dumps/capco_dump_*.dump

# Linux/Mac
npm run db:restore dumps/capco_dump_*.dump
```

## 📁 Structure des Fichiers

Les dumps sont nommés selon le format:
```
capco_dump_YYYYMMDD_HHMMSS.dump  # Format custom (compressé)
capco_dump_YYYYMMDD_HHMMSS.sql   # Format SQL (lisible)
```

## ⚠️ Important

- Les fichiers de dump ne sont PAS versionnés dans Git
- Gardez plusieurs versions de dumps pour pouvoir revenir en arrière
- Compressez les gros dumps avant de les transférer
- Faites toujours un backup avant de restaurer

## 📚 Documentation

- [Guide Rapide](../../docs/QUICK_DUMP_RESTORE.md)
- [Guide Complet](../../docs/GUIDE_DUMP_RESTORE_DOCKER.md)
