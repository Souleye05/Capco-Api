const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        console.log('🔌 Test de connexion à la base de données...');
        await client.connect();
        console.log('✅ Connexion réussie !');

        // Vérifier les tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('Immeuble', 'Lot', 'Locataire', 'Arrierage')
            ORDER BY table_name;
        `);

        console.log('\n📋 Tables trouvées:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Compter les enregistrements
        if (result.rows.length > 0) {
            for (const row of result.rows) {
                const countResult = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
                console.log(`   ${row.table_name}: ${countResult.rows[0].count} enregistrements`);
            }
        }

    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
    } finally {
        await client.end();
    }
}

testConnection();