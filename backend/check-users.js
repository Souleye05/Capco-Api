const { Client } = require('pg');

async function checkUsers() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'passer',
        database: 'migration_db'
    });

    try {
        await client.connect();
        console.log('👥 Vérification des utilisateurs...\n');

        // Lister les utilisateurs
        const usersResult = await client.query(`
            SELECT u.id, u.email, u.email_verified, ur.role
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            ORDER BY u.email
        `);

        console.log(`📊 ${usersResult.rows.length} utilisateurs trouvés:`);
        
        const userMap = new Map();
        usersResult.rows.forEach(row => {
            if (!userMap.has(row.email)) {
                userMap.set(row.email, { ...row, roles: [] });
            }
            if (row.role) {
                userMap.get(row.email).roles.push(row.role);
            }
        });

        userMap.forEach((user, email) => {
            console.log(`   ${email} (${user.email_verified ? 'vérifié' : 'non vérifié'}) - Rôles: ${user.roles.join(', ') || 'aucun'}`);
        });

        // Tester la connexion avec le premier utilisateur admin
        const adminUsers = Array.from(userMap.values()).filter(u => u.roles.includes('admin'));
        if (adminUsers.length > 0) {
            console.log(`\n🔑 Utilisateur admin trouvé: ${adminUsers[0].email}`);
            console.log('💡 Essayez de vous connecter avec cet email et le mot de passe correspondant.');
        } else {
            console.log('\n❌ Aucun utilisateur admin trouvé.');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

checkUsers();