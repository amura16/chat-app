const cassandra = require('cassandra-driver');
const client = require('../../config/database');
const authenticateToken = require('../middlewares/authMiddleware');

const router = require('express').Router();


// =====================================================
// VALIDATION UUID
// =====================================================

function isValidUUID(value) {

    return typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

}


// =====================================================
// SEARCH USER
// =====================================================

router.get(
    '/search',
    authenticateToken,
    async (req, res) => {

        try {

            const { username } = req.query;

            if (!username || !username.trim()) {
                return res.json([]);
            }

            const cleanUsername = username.trim();

            const query = `
                SELECT
                    username,
                    user_id,
                    email
                FROM chat_app.users_by_username
                WHERE username = ?
            `;

            const result = await client.execute(
                query,
                [cleanUsername],
                {
                    prepare: true
                }
            );

            const users = result.rows.map(user => ({
                user_id: user.user_id
                    ? user.user_id.toString()
                    : null,

                username: user.username,

                email: user.email
            }));

            return res.json(users);

        } catch (error) {

            console.error(
                '❌ Erreur recherche utilisateur:',
                error
            );

            return res.status(500).json({
                error: "Erreur lors de la recherche de l'utilisateur.",
                details: error.message
            });
        }
    }
);


// =====================================================
// GET USER BY ID
// =====================================================

router.get(
    '/:id',
    authenticateToken,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (!isValidUUID(id)) {

                return res.status(400).json({
                    error:
                        'Identifiant utilisateur invalide.'
                });

            }


            const query = `
                SELECT
                    user_id,
                    username,
                    email,
                    created_at
                FROM chat_app.users_by_id
                WHERE user_id = ?
            `;


            const result =
                await client.execute(
                    query,
                    [
                        cassandra.types.Uuid.fromString(id)
                    ],
                    {
                        prepare: true
                    }
                );


            if (result.rowLength === 0) {

                return res.status(404).json({
                    error:
                        'Utilisateur non trouvé.'
                });

            }


            const user =
                result.rows[0];


            return res.json({

                user_id:
                    user.user_id.toString(),

                username:
                    user.username,

                email:
                    user.email,

                created_at:
                    user.created_at
                        ? user.created_at.toISOString()
                        : null
            });


        } catch (error) {

            console.error(
                '❌ Erreur récupération profil:',
                error
            );

            return res.status(500).json({
                error:
                    'Erreur serveur lors de la récupération du profil.'
            });
        }
    }
);


module.exports = router;