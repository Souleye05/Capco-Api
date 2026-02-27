const { Client } = require('pg');

async function checkArrierages() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        await client.connect();
        console.log('🔍 Vérification des arriérés...\n');

        // Compter les arriérés
        const countResult = await client.query('SELECT COUNT(*) FROM arrierages_loyers');
        console.log(`📊 Nombre d'arriérés: ${countResult.rows[0].count}`);

        // Vérifier la structure de la table
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'arrierages_loyers' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Structure de la table arrierages_loyers:');
        structureResult.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });

        // Vérifier s'il y a des données
        if (parseInt(countResult.rows[0].count) === 0) {
            console.log('\n❌ Aucun arriéré trouvé. Créons-en quelques-uns...');
            
            // Vérifier s'il y a des lots
            const lotsResult = await client.query('SELECT COUNT(*) FROM lots');
            console.log(`📊 Nombre de lots: ${lotsResult.rows[0].count}`);
            
            if (parseInt(lotsResult.rows[0].count) > 0) {
                // Récupérer quelques lots
                const lotsData = await client.query(`
                    SELECT l.id, l.numero, i.nom as immeuble_nom, loc.nom as locataire_nom
                    FROM lots l
                    JOIN immeubles i ON l.immeuble_id = i.id
                    LEFT JOIN locataires loc ON l.locataire_id = loc.id
                    WHERE l.statut = 'OCCUPE'
                    LIMIT 3
                `);
                
                console.log('\n🏠 Lots disponibles pour créer des arriérés:');
                lotsData.rows.forEach(lot => {
                    console.log(`   ${lot.immeuble_nom} - ${lot.numero}: ${lot.locataire_nom || 'Vacant'}`);
                });
                
                // Créer des arriérés de test
                for (const lot of lotsData.rows) {
                    const montantDu = 150000 + Math.floor(Math.random() * 100000);
                    const montantPaye = Math.floor(Math.random() * montantDu);
                    
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
                        montantPaye === 0 ? 'IMPAYE' : (montantPaye < montantDu ? 'PARTIEL' : 'SOLDE')
                    ]);
                    
                    console.log(`✅ Arriéré créé pour ${lot.immeuble_nom} ${lot.numero}: ${montantDu} FCFA`);
                }
                
                // Recompter
                const newCountResult = await client.query('SELECT COUNT(*) FROM arrierages_loyers');
                console.log(`\n🎉 ${newCountResult.rows[0].count} arriérés maintenant en base !`);
            }
        } else {
            // Afficher quelques arriérés existants
            const arrieragesResult = await client.query(`
                SELECT a.*, l.numero as lot_numero, i.nom as immeuble_nom, loc.nom as locataire_nom
                FROM arrierages_loyers a
                JOIN lots l ON a.lot_id = l.id
                JOIN immeubles i ON l.immeuble_id = i.id
                LEFT JOIN locataires loc ON l.locataire_id = loc.id
                LIMIT 5
            `);
            
            console.log('\n📋 Arriérés existants:');
            arrieragesResult.rows.forEach(arr => {
                console.log(`   ${arr.immeuble_nom} ${arr.lot_numero}: ${arr.montant_du} FCFA (${arr.statut})`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

checkArrierages();