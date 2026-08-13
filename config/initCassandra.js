const db = require('./database');

async function initializeDatabase() {

    try {

        console.log('🔄 Connexion à Cassandra...');

        await db.connect();

        console.log('✅ Connecté à Cassandra');


        // =====================================================
        // KEYSPACE
        // =====================================================

        await db.execute(`
            CREATE KEYSPACE IF NOT EXISTS chat_app
            WITH replication = {
                'class': 'NetworkTopologyStrategy',
                'AWS_VPC_US_WEST_2': 3
            }
        `);

        console.log('✅ Keyspace chat_app vérifié');


        // =====================================================
        // USERS BY EMAIL
        // =====================================================

        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_app.users_by_email (
                email text PRIMARY KEY,
                user_id uuid,
                username text,
                password_hash text,
                created_at timestamp
            )
        `);


        // =====================================================
        // USERS BY ID
        // =====================================================

        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_app.users_by_id (
                user_id uuid PRIMARY KEY,
                email text,
                username text,
                password_hash text,
                created_at timestamp
            )
        `);


        // =====================================================
        // USERS BY USERNAME
        // =====================================================

        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_app.users_by_username (
                username text PRIMARY KEY,
                user_id uuid,
                email text,
                created_at timestamp
            )
        `);


        // =====================================================
        // CONVERSATIONS
        // =====================================================

        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_app.user_conversations (
                user_id uuid,
                conversation_id uuid,
                participant_id uuid,
                participant_username text,
                updated_at timestamp,
                PRIMARY KEY ((user_id), updated_at, conversation_id)
            )
            WITH CLUSTERING ORDER BY (updated_at DESC)
        `);


        // =====================================================
        // MESSAGES
        // =====================================================

        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_app.messages_by_conversation (
                conversation_id uuid,
                created_at timestamp,
                message_id uuid,
                sender_id uuid,
                sender_username text,
                content text,
                PRIMARY KEY ((conversation_id), created_at, message_id)
            )
            WITH CLUSTERING ORDER BY (created_at ASC)
        `);


        console.log('==========================================');
        console.log('✅ Cassandra initialisée');
        console.log('==========================================');

    } catch (error) {

        console.error(
            '❌ IMPOSSIBLE DE DÉMARRER LE SERVEUR'
        );

        console.error(error);

        throw error;
    }
}


module.exports = initializeDatabase;