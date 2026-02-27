const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUser() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        await client.connect();
        console.log('👤 Création d\'un utilisateur de test...\n');

        const email = 'test@arrieres.com';
        const password = 'test123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            console.log('✅ Utilisateur existe déjà');
            const userId = existingUser.rows[0].id;
            
            // Mettre à jour le mot de passe
            await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
            console.log('✅ Mot de passe mis à jour');
        } else {
            // Créer l'utilisateur
            const userResult = await client.query(`
                INSERT INTO users (id, email, password_hash, email_verified, created_at)
                VALUES (gen_random_uuid(), $1, $2, true, NOW())
                RETURNING id
            `, [email, hashedPassword]);
            
            const userId = userResult.rows[0].id;
            console.log('✅ Utilisateur créé');
            
            // Ajouter le rôle admin
            await client.query(`
                INSERT INTO user_roles (user_id, role)
                VALUES ($1, 'admin')
            `, [userId]);
            
            console.log('✅ Rôle admin ajouté');
        }
        
        console.log(`\n🔑 Utilisateur de test créé:`);
        console.log(`   Email: ${email}`);
        console.log(`   Mot de passe: ${password}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

createTestUser();