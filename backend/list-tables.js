const { Client } = require('pg');

async function listTables() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        console.log('📋 Liste de toutes les tables...');
        await client.connect();

        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log(`\n✅ ${result.rows.length} tables trouvées:`);
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Chercher spécifiquement les tables liées aux arriérés
        const arrierageResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name ILIKE '%arriere%' OR table_name ILIKE '%arrierage%')
            ORDER BY table_name;
        `);

        if (arrierageResult.rows.length > 0) {
            console.log('\n🎯 Tables liées aux arriérés:');
            arrierageResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

listTables();