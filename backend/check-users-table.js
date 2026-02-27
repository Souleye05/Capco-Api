const { Client } = require('pg');

async function checkUsersTable() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        await client.connect();
        console.log('👤 Vérification de la structure de la table users...\n');

        // Vérifier la structure de la table
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);

        console.log('📋 Structure de la table users:');
        structureResult.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });

        // Afficher quelques utilisateurs
        const usersResult = await client.query('SELECT id, email FROM users LIMIT 3');
        console.log('\n👥 Quelques utilisateurs:');
        usersResult.rows.forEach(user => {
            console.log(`   ${user.email} (${user.id})`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

checkUsersTable();