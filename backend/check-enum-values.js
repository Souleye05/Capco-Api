const { Client } = require('pg');

async function checkEnumValues() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        await client.connect();
        console.log('🔍 Vérification des valeurs d\'enum...\n');

        // Récupérer les valeurs de l'enum StatutArrierage
        const enumResult = await client.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid 
                FROM pg_type 
                WHERE typname = 'StatutArrierage'
            )
            ORDER BY enumsortorder;
        `);

        console.log('📋 Valeurs possibles pour StatutArrierage:');
        enumResult.rows.forEach(row => {
            console.log(`   - ${row.enumlabel}`);
        });

        // Créer des arriérés avec les bonnes valeurs
        const lotsData = await client.query(`
            SELECT l.id, l.numero, i.nom as immeuble_nom, loc.nom as locataire_nom
            FROM lots l
            JOIN immeubles i ON l.immeuble_id = i.id
            LEFT JOIN locataires loc ON l.locataire_id = loc.id
            WHERE l.statut = 'OCCUPE'
            LIMIT 3
        `);

        console.log('\n🏠 Création d\'arriérés de test...');
        
        for (let i = 0; i < lotsData.rows.length; i++) {
            const lot = lotsData.rows[i];
            const montantDu = 150000 + (i * 50000);
            let montantPaye, statut;
            
            if (i === 0) {
                // Premier arriéré: complètement impayé
                montantPaye = 0;
                statut = 'EN_COURS';
            } else if (i === 1) {
                // Deuxième arriéré: partiellement payé
                montantPaye = montantDu * 0.6;
                statut = 'EN_COURS';
            } else {
                // Troisième arriéré: soldé
                montantPaye = montantDu;
                statut = 'SOLDE';
            }
            
            await client.query(`
                INSERT INTO arrierages_loyers (
                    id, lot_id, montant_du, montant_paye, montant_restant,
                    periode_debut, periode_fin, description, statut,
                    created_at, created_by
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4,
                    '2025-01-01', '2025-02-28', $5, $6,
                    NOW(), 'system'
                )
            `, [
                lot.id,
                montantDu,
                montantPaye,
                montantDu - montantPaye,
                `Arriérés test - ${lot.immeuble_nom} ${lot.numero}`,
                statut
            ]);
            
            console.log(`✅ Arriéré créé: ${lot.immeuble_nom} ${lot.numero} - ${montantDu} FCFA (${statut})`);
        }
        
        // Vérifier le résultat
        const countResult = await client.query('SELECT COUNT(*) FROM arrierages_loyers');
        console.log(`\n🎉 ${countResult.rows[0].count} arriérés créés avec succès !`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

checkEnumValues();