const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cassandra = require('cassandra-driver');

const client = require('../../config/database');

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET || 'secret_key_cassandra_chat';


// =====================================================
// REGISTER
// =====================================================

router.post('/register', async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                error: 'Veuillez remplir tous les champs.'
            });

        }


        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim().toLowerCase();


        // =====================================================
        // VÉRIFIER EMAIL
        // =====================================================

        const emailQuery = `
            SELECT user_id
            FROM chat_app.users_by_email
            WHERE email = ?
        `;

        const emailResult =
            await client.execute(
                emailQuery,
                [cleanEmail],
                {
                    prepare: true
                }
            );


        if (emailResult.rowLength > 0) {

            return res.status(400).json({
                error: 'Cette adresse email est déjà utilisée.'
            });

        }


        // =====================================================
        // VÉRIFIER USERNAME
        // =====================================================

        const usernameQuery = `
            SELECT user_id
            FROM chat_app.users_by_username
            WHERE username = ?
        `;

        const usernameResult =
            await client.execute(
                usernameQuery,
                [cleanUsername],
                {
                    prepare: true
                }
            );


        if (usernameResult.rowLength > 0) {

            return res.status(400).json({
                error: 'Ce nom d\'utilisateur est déjà utilisé.'
            });

        }


        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const passwordHash =
            await bcrypt.hash(
                String(password),
                10
            );


        // =====================================================
        // UUID
        // =====================================================

        const userId =
            cassandra.types.Uuid.random();

        const createdAt =
            new Date();


        // =====================================================
        // INSERT USERS BY EMAIL
        // =====================================================

        await client.execute(
            `
            INSERT INTO chat_app.users_by_email (
                email,
                user_id,
                username,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                cleanEmail,
                userId,
                cleanUsername,
                passwordHash,
                createdAt
            ],
            {
                prepare: true
            }
        );


        // =====================================================
        // INSERT USERS BY ID
        // =====================================================

        await client.execute(
            `
            INSERT INTO chat_app.users_by_id (
                user_id,
                email,
                username,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                cleanEmail,
                cleanUsername,
                passwordHash,
                createdAt
            ],
            {
                prepare: true
            }
        );


        // =====================================================
        // INSERT USERS BY USERNAME
        // =====================================================

        await client.execute(
            `
            INSERT INTO chat_app.users_by_username (
                username,
                user_id,
                email,
                created_at
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cleanUsername,
                userId,
                cleanEmail,
                createdAt
            ],
            {
                prepare: true
            }
        );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            message:
                'Utilisateur créé avec succès.',

            user_id:
                userId.toString(),

            username:
                cleanUsername,

            email:
                cleanEmail
        });


    } catch (error) {

        console.error(
            '❌ Erreur lors du register:',
            error
        );

        return res.status(500).json({
            error:
                "Erreur serveur lors de l'inscription.",
            details:
                error.message
        });
    }
});


// =====================================================
// LOGIN
// =====================================================

router.post('/login', async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                error:
                    'Veuillez remplir tous les champs.'
            });

        }


        const cleanEmail =
            email.trim().toLowerCase();


        // =====================================================
        // RECHERCHE PAR EMAIL
        // =====================================================

        const query = `
            SELECT
                user_id,
                username,
                email,
                password_hash
            FROM chat_app.users_by_email
            WHERE email = ?
        `;


        const result =
            await client.execute(
                query,
                [cleanEmail],
                {
                    prepare: true
                }
            );


        if (result.rowLength === 0) {

            return res.status(401).json({
                error: 'Identifiants invalides.'
            });

        }


        const user =
            result.rows[0];


        // =====================================================
        // PASSWORD
        // =====================================================

        const isPasswordValid =
            await bcrypt.compare(
                String(password),
                String(user.password_hash)
            );


        if (!isPasswordValid) {

            return res.status(401).json({
                error: 'Identifiants invalides.'
            });

        }


        // =====================================================
        // JWT
        // =====================================================

        const token =
            jwt.sign(
                {
                    userId:
                        user.user_id.toString(),

                    username:
                        user.username
                },
                JWT_SECRET,
                {
                    expiresIn: '24h'
                }
            );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.json({

            user_id:
                user.user_id.toString(),

            username:
                user.username,

            email:
                user.email,

            token
        });


    } catch (error) {

        console.error(
            '❌ Erreur lors du login:',
            error
        );

        return res.status(500).json({
            error:
                'Erreur serveur lors de la connexion.'
        });
    }
});


module.exports = router;