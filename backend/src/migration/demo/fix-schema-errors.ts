import * as fs from 'fs';
import * as path from 'path';

/**
 * Script pour corriger automatiquement les erreurs dans le schéma Prisma généré
 */
function fixSchemaErrors() {
  console.log('🔧 Correction des erreurs dans le schéma Prisma...\n');

  const schemaPath = path.join('prisma', 'schema.prisma');
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  console.log('📝 Corrections appliquées:');

  // 1. Corriger les valeurs par défaut des enums (utiliser les valeurs enum au lieu de strings)
  const enumDefaults = [
    { pattern: /@default\("physique"\)/g, replacement: '@default(physique)' },
    { pattern: /@default\("active"\)/g, replacement: '@default(ACTIVE)' },
    { pattern: /@default\("mise_en_etat"\)/g, replacement: '@default(MISE_EN_ETAT)' },
    { pattern: /@default\("a_venir"\)/g, replacement: '@default(A_VENIR)' },
    { pattern: /@default\("en_cours"\)/g, replacement: '@default(EN_COURS)' },
    { pattern: /@default\("forfait"\)/g, replacement: '@default(FORFAIT)' },
    { pattern: /@default\("autres"\)/g, replacement: '@default(AUTRES)' },
    { pattern: /@default\("autre"\)/g, replacement: '@default(AUTRE)' },
    { pattern: /@default\("libre"\)/g, replacement: '@default(LIBRE)' },
    { pattern: /@default\("actif"\)/g, replacement: '@default(ACTIF)' },
    { pattern: /@default\("autres_depenses"\)/g, replacement: '@default(AUTRES_DEPENSES)' },
    { pattern: /@default\("morale"\)/g, replacement: '@default(morale)' },
    { pattern: /@default\("brouillon"\)/g, replacement: '@default(BROUILLON)' },
    { pattern: /@default\("moyenne"\)/g, replacement: '@default(MOYENNE)' },
  ];

  enumDefaults.forEach(({ pattern, replacement }) => {
    if (pattern.test(schemaContent)) {
      schemaContent = schemaContent.replace(pattern, replacement);
      console.log(`   ✅ Corrigé: ${pattern.source} → ${replacement}`);
    }
  });

  // 2. Corriger les noms de champs manquants dans AuditLog
  schemaContent = schemaContent.replace(
    /@@index\(\[entityType, entityId\]\)/g,
    '@@index([entityType, entityId])'
  );

  // Vérifier si les champs entityType et entityId existent
  if (!schemaContent.includes('entityType String')) {
    schemaContent = schemaContent.replace(
      /entityReference String\? @map\("entity_reference"\)/,
      `entityType String @map("entity_type")
  entityId String? @map("entity_id")
  entityReference String? @map("entity_reference")`
    );
    console.log('   ✅ Ajouté: champs entityType et entityId manquants');
  }

  // 3. Corriger les relations dupliquées
  // Supprimer les relations dupliquées dans Parties
  schemaContent = schemaContent.replace(
    /dossiersRecouvrements DossiersRecouvrement\[\]\s*dossiersRecouvrements DossiersRecouvrement\[\]/g,
    'dossiersRecouvrements DossiersRecouvrement[]'
  );

  // Corriger les relations dans DossiersRecouvrement
  schemaContent = schemaContent.replace(
    /parties Parties @relation\(fields: \[creancierId\], references: \[id\]\)\s*parties Parties @relation\(fields: \[debiteurId\], references: \[id\]\)/g,
    `creancier Parties? @relation("CreancierRelation", fields: [creancierId], references: [id])
  debiteur Parties? @relation("DebiteurRelation", fields: [debiteurId], references: [id])`
  );

  // Corriger les relations inverses dans Parties
  schemaContent = schemaContent.replace(
    /dossiersRecouvrements DossiersRecouvrement\[\]/g,
    `dossiersCreancier DossiersRecouvrement[] @relation("CreancierRelation")
  dossiersDebiteur DossiersRecouvrement[] @relation("DebiteurRelation")`
  );

  // 4. Ajouter les enums manquants
  const missingEnums = [
    `enum TypePartie {
  physique
  morale
}`,
    `enum TypeRelation {
  creancier
  debiteur
  proprietaire
  locataire
  adversaire
  demandeur
  defendeur
}`,
    `enum TypeDepenseDossier {
  FRAIS_HUISSIER
  FRAIS_GREFFE
  TIMBRES_FISCAUX
  FRAIS_COURRIER
  FRAIS_DEPLACEMENT
  FRAIS_EXPERTISE
  AUTRES
}`,
    `enum StatutBail {
  ACTIF
  INACTIF
}`,
    `enum TypeDepenseImmeuble {
  PLOMBERIE_ASSAINISSEMENT
  ELECTRICITE_ECLAIRAGE
  ENTRETIEN_MAINTENANCE
  SECURITE_GARDIENNAGE_ASSURANCE
  AUTRES_DEPENSES
}`,
    `enum StatutClientConseil {
  ACTIF
  SUSPENDU
  RESILIE
}`,
    `enum StatutFacture {
  BROUILLON
  ENVOYEE
  PAYEE
  EN_RETARD
  ANNULEE
}`,
    `enum TypeTache {
  CONSULTATION
  REDACTION
  NEGOCIATION
  RECHERCHE
  REUNION
  APPEL
  EMAIL
  AUTRE
}`,
    `enum TypeAlerte {
  AUDIENCE_NON_RENSEIGNEE
  DOSSIER_SANS_ACTION
  LOYER_IMPAYE
  ECHEANCE_PROCHE
  FACTURE_IMPAYEE
}`,
    `enum PrioriteAlerte {
  HAUTE
  MOYENNE
  BASSE
}`
  ];

  // Ajouter les enums manquants après les enums existants
  const enumInsertPoint = schemaContent.indexOf('// Models extracted from Supabase tables');
  if (enumInsertPoint > -1) {
    const enumsToAdd = missingEnums.filter(enumDef => {
      const enumName = enumDef.match(/enum (\w+)/)?.[1];
      return enumName && !schemaContent.includes(`enum ${enumName}`);
    });

    if (enumsToAdd.length > 0) {
      const enumsSection = enumsToAdd.join('\n\n') + '\n\n';
      schemaContent = schemaContent.replace(
        '// Models extracted from Supabase tables',
        enumsSection + '// Models extracted from Supabase tables'
      );
      console.log(`   ✅ Ajouté: ${enumsToAdd.length} enums manquants`);
    }
  }

  // 5. Écrire le schéma corrigé
  fs.writeFileSync(schemaPath, schemaContent);

  console.log('\n✅ Schéma Prisma corrigé avec succès !');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. npx prisma generate');
  console.log('   2. npx prisma db push');
}

// Exécuter si appelé directement
if (require.main === module) {
  fixSchemaErrors();
}

export { fixSchemaErrors };