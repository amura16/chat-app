const db = require('../../config/database');
const { types } = require('cassandra-driver');

class UserModel {

    // ==========================================
    // TROUVER UN UTILISATEUR PAR EMAIL
    // ==========================================

    static async findByEmail(email) {

        const query = `
            SELECT
                email,
                user_id,
                username,
                password_hash
            FROM chat_app.users_by_email
            WHERE email = ?
        `;

        const result = await db.execute(
            query,
            [email],
            {
                prepare: true
            }
        );

        if (result.rowLength === 0) {
            return null;
        }

        return result.rows[0];
    }


    // ==========================================
    // TROUVER UN UTILISATEUR PAR ID
    // ==========================================

    static async findById(userId) {

        const query = `
            SELECT
                user_id,
                email,
                username,
                password_hash
            FROM chat_app.users_by_id
            WHERE user_id = ?
        `;

        const result = await db.execute(
            query,
            [
                types.Uuid.fromString(userId)
            ],
            {
                prepare: true
            }
        );

        if (result.rowLength === 0) {
            return null;
        }

        return result.rows[0];
    }


    // ==========================================
    // CRÉER UN UTILISATEUR
    // ==========================================

    static async create({
        username,
        email,
        passwordHash
    }) {

        const userId = types.Uuid.random();

        // ==========================================
        // INSERT USERS BY EMAIL
        // ==========================================

        const queryByEmail = `
            INSERT INTO chat_app.users_by_email (
                email,
                user_id,
                username,
                password_hash
            )
            VALUES (?, ?, ?, ?)
        `;

        await db.execute(
            queryByEmail,
            [
                email,
                userId,
                username,
                passwordHash
            ],
            {
                prepare: true
            }
        );

        try {

            // ==========================================
            // INSERT USERS BY ID
            // ==========================================

            const queryById = `
                INSERT INTO chat_app.users_by_id (
                    user_id,
                    email,
                    username,
                    password_hash
                )
                VALUES (?, ?, ?, ?)
            `;

            await db.execute(
                queryById,
                [
                    userId,
                    email,
                    username,
                    passwordHash
                ],
                {
                    prepare: true
                }
            );

        } catch (error) {

            // ==========================================
            // ROLLBACK
            // ==========================================

            try {

                await db.execute(
                    `
                    DELETE FROM chat_app.users_by_email
                    WHERE email = ?
                    `,
                    [email],
                    {
                        prepare: true
                    }
                );

            } catch (rollbackError) {

                console.error(
                    '❌ Erreur rollback :',
                    rollbackError
                );
            }

            throw error;
        }

        console.log(
            `✅ Utilisateur créé : ${userId.toString()}`
        );

        return userId;
    }


    // ==========================================
    // SUPPRIMER UN UTILISATEUR
    // ==========================================

    static async delete(userId, email) {

        await db.execute(
            `
            DELETE FROM chat_app.users_by_id
            WHERE user_id = ?
            `,
            [
                types.Uuid.fromString(userId)
            ],
            {
                prepare: true
            }
        );

        await db.execute(
            `
            DELETE FROM chat_app.users_by_email
            WHERE email = ?
            `,
            [email],
            {
                prepare: true
            }
        );

        return true;
    }
}

module.exports = UserModel;