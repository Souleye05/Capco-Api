import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableCount {
  table: string;
  count: number;
}

async function verifyMigration() {
  console.log('🔍 Vérification de la migration en production...\n');

  try {
    // 1. Vérifier la connexion à la base de données
    console.log('1️⃣  Test de connexion à la base de données...');
    await prisma.$connect();
    console.log('   ✅ Connexion réussie!\n');

    // 2. Vérifier les migrations Prisma
    console.log('2️⃣  Vérification des migrations Prisma...');
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 10
    `;
    
    console.log(`   ✅ ${migrations.length} migrations trouvées`);
    migrations.forEach(m => {
      console.log(`      - ${m.migration_name} (${m.applied_steps_count} étapes)`);
    });
    console.log('');

    // 3. Compter les enregistrements dans chaque table
    console.log('3️⃣  Comptage des enregistrements par table...');
    
    const tables = [
      'users',
      'user_roles',
      'juridictions',
      'affaires',
      'parties_affaires',
      'audiences',
      'resultats_audiences',
      'proprietaires',
      'immeubles',
      'lots',
      'locataires',
      'baux',
      'dossiers_recouvrement',
      'clients_conseil',
      'audit_log',
    ];

    const counts: TableCount[] = [];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const count = parseInt(result[0].count);
        counts.push({ table, count });
        
        const icon = count > 0 ? '✅' : '⚠️ ';
        console.log(`   ${icon} ${table.padEnd(30)} : ${count} enregistrements`);
      } catch (error) {
        console.log(`   ❌ ${table.padEnd(30)} : Erreur`);
      }
    }
    console.log('');

    // 4. Vérifier les juridictions
    console.log('4️⃣  Vérification des juridictions...');
    const juridictionsCount = await prisma.juridictions.count();
    if (juridictionsCount > 0) {
      console.log(`   ✅ ${juridictionsCount} juridictions trouvées`);
      const sample = await prisma.juridictions.findMany({ take: 3 });
      sample.forEach(j => {
        console.log(`      - ${j.nom} (${j.code})`);
      });
    } else {
      console.log('   ⚠️  Aucune juridiction trouvée. Exécutez: npm run seed:juridictions');
    }
    console.log('');

    // 5. Vérifier les utilisateurs
    console.log('5️⃣  Vérification des utilisateurs...');
    const usersCount = await prisma.user.count();
    console.log(`   ${usersCount > 0 ? '✅' : '⚠️ '} ${usersCount} utilisateurs trouvés`);
    
    if (usersCount > 0) {
      const admins = await prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: 'admin',
            },
          },
        },
        include: {
          userRoles: true,
        },
      });
      
      console.log(`   ${admins.length > 0 ? '✅' : '⚠️ '} ${admins.length} administrateurs trouvés`);
      admins.forEach(admin => {
        console.log(`      - ${admin.email}`);
      });
    } else {
      console.log('   ⚠️  Aucun utilisateur trouvé. Exécutez le script create-admin-user.ts');
    }
    console.log('');

    // 6. Vérifier les index
    console.log('6️⃣  Vérification des index...');
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    console.log(`   ✅ ${indexes.length} index trouvés\n`);

    // 7. Vérifier les contraintes de clés étrangères
    console.log('7️⃣  Vérification des contraintes...');
    const constraints = await prisma.$queryRaw<any[]>`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
      ORDER BY tc.table_name, tc.constraint_type
    `;
    
    const fkCount = constraints.filter(c => c.constraint_type === 'FOREIGN KEY').length;
    const pkCount = constraints.filter(c => c.constraint_type === 'PRIMARY KEY').length;
    const uqCount = constraints.filter(c => c.constraint_type === 'UNIQUE').length;
    
    console.log(`   ✅ ${pkCount} clés primaires`);
    console.log(`   ✅ ${fkCount} clés étrangères`);
    console.log(`   ✅ ${uqCount} contraintes uniques\n`);

    // 8. Résumé
    console.log('📊 RÉSUMÉ DE LA MIGRATION\n');
    console.log('   Base de données:');
    const dbInfo = await prisma.$queryRaw<any[]>`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `;
    console.log(`      Database: ${dbInfo[0].database}`);
    console.log(`      User: ${dbInfo[0].user}`);
    console.log(`      Version: ${dbInfo[0].version.split(',')[0]}\n`);

    const totalRecords = counts.reduce((sum, c) => sum + c.count, 0);
    console.log(`   Total d'enregistrements: ${totalRecords}`);
    console.log(`   Tables avec données: ${counts.filter(c => c.count > 0).length}/${counts.length}\n`);

    // Recommandations
    console.log('💡 RECOMMANDATIONS\n');
    
    if (juridictionsCount === 0) {
      console.log('   ⚠️  Exécutez: npm run seed:juridictions');
    }
    
    if (usersCount === 0) {
      console.log('   ⚠️  Créez un utilisateur admin avec: ts-node scripts/create-admin-user.ts');
    }
    
    if (totalRecords === 0) {
      console.log('   ℹ️  La base de données est vide. C\'est normal pour une nouvelle installation.');
      console.log('   ℹ️  Les données seront créées via l\'application.');
    }
    
    console.log('\n✅ Vérification terminée!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
verifyMigration();
