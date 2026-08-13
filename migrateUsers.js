require('dotenv').config();

const client = require('./config/database');

async function migrateUsers() {

    try {

        await client.connect();

        console.log('✅ Connecté à Cassandra');


        // ==========================================
        // RÉCUPÉRER LES UTILISATEURS
        // ==========================================

        const result = await client.execute(`
            SELECT
                user_id,
                username,
                email
            FROM chat_app.users_by_id
        `);


        console.log(
            `👥 ${result.rows.length} utilisateur(s) trouvé(s)`
        );


        // ==========================================
        // COPIER VERS users_by_username
        // ==========================================

        for (const user of result.rows) {

            await client.execute(
                `
                INSERT INTO chat_app.users_by_username (
                    username,
                    user_id,
                    email
                )
                VALUES (?, ?, ?)
                `,
                [
                    user.username,
                    user.user_id,
                    user.email
                ],
                {
                    prepare: true
                }
            );


            console.log(
                `✅ ${user.username} → users_by_username`
            );
        }


        console.log('');
        console.log('🎉 Migration terminée');


    } catch (error) {

        console.error(
            '❌ Erreur migration :',
            error
        );

    } finally {

        await client.shutdown();
    }
}

migrateUsers();
