require('dotenv').config();

const client = require('./config/database');

async function test() {
    try {
        await client.connect();

        console.log('\n========== USERS BY ID ==========');

        let result = await client.execute(
            'SELECT * FROM chat_app.users_by_id'
        );

        console.table(
            result.rows.map(user => ({
                user_id: user.user_id?.toString(),
                username: user.username,
                email: user.email
            }))
        );


        console.log('\n========== USERS BY EMAIL ==========');

        result = await client.execute(
            'SELECT * FROM chat_app.users_by_email'
        );

        console.table(
            result.rows.map(user => ({
                user_id: user.user_id?.toString(),
                username: user.username,
                email: user.email
            }))
        );


        console.log('\n========== USERS BY USERNAME ==========');

        result = await client.execute(
            'SELECT * FROM chat_app.users_by_username'
        );

        console.table(
            result.rows.map(user => ({
                user_id: user.user_id?.toString(),
                username: user.username,
                email: user.email
            }))
        );

    } catch (error) {
        console.error('❌ Erreur :', error);
    } finally {
        await client.shutdown();
    }
}

test();

