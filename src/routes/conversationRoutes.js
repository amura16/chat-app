const express = require('express');
const cassandra = require('cassandra-driver');

const client = require('../../config/database');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();


// =====================================================
// VALIDATION UUID
// =====================================================

function isValidUUID(value) {
    if (typeof value !== 'string') {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


// =====================================================
// GET /api/conversations
// Récupérer les conversations de l'utilisateur connecté
// =====================================================

router.get('/', authenticateToken, async (req, res) => {
    try {

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });
        }

        const currentUserId = req.user.userId;

        // ==========================================
        // VALIDATION UUID
        // ==========================================

        if (!isValidUUID(currentUserId)) {
            return res.status(400).json({
                error: 'Identifiant utilisateur invalide.'
            });
        }

        const userUuid = cassandra.types.Uuid.fromString(
            currentUserId
        );

        // ==========================================
        // RÉCUPÉRER LES CONVERSATIONS
        // ==========================================

        const query = `
            SELECT
                user_id,
                conversation_id,
                participant_id,
                participant_username,
                my_username,
                created_at
            FROM chat_app.conversations_by_user
            WHERE user_id = ?
        `;

        const result = await client.execute(
            query,
            [userUuid],
            {
                prepare: true
            }
        );

        // ==========================================
        // FORMATAGE
        // ==========================================

        const conversations = result.rows.map(row => ({
            user_id: row.user_id
                ? row.user_id.toString()
                : null,

            conversation_id: row.conversation_id
                ? row.conversation_id.toString()
                : null,

            participant_id: row.participant_id
                ? row.participant_id.toString()
                : null,

            participant_username:
                row.participant_username,

            my_username:
                row.my_username,

            created_at:
                row.created_at
                    ? row.created_at.toISOString()
                    : null
        }));

        return res.json(conversations);

    } catch (error) {

        console.error(
            '❌ Erreur récupération des conversations:',
            error
        );

        return res.status(500).json({
            error: 'Erreur serveur lors de la récupération des conversations.',
            details: error.message
        });
    }
});


// =====================================================
// POST /api/conversations
// Créer une conversation
// =====================================================

router.post('/', authenticateToken, async (req, res) => {
    try {

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });
        }

        const currentUserId = req.user.userId;
        const currentUsername = req.user.username;

        // ==========================================
        // VALIDATION UUID
        // ==========================================

        if (!isValidUUID(currentUserId)) {
            return res.status(400).json({
                error: 'Identifiant utilisateur invalide.'
            });
        }

        // ==========================================
        // BODY
        // ==========================================

        const {
            targetUsername
        } = req.body;

        if (!targetUsername || !targetUsername.trim()) {
            return res.status(400).json({
                error: "Le nom d'utilisateur destinataire est requis."
            });
        }

        const cleanTargetUsername =
            targetUsername.trim();

        // ==========================================
        // RECHERCHE UTILISATEUR
        // ==========================================

        const userQuery = `
            SELECT
                username,
                user_id,
                email
            FROM chat_app.users_by_username
            WHERE username = ?
        `;

        const userResult = await client.execute(
            userQuery,
            [cleanTargetUsername],
            {
                prepare: true
            }
        );

        if (userResult.rowLength === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable.'
            });
        }

        const targetUser = userResult.rows[0];

        // ==========================================
        // EMPÊCHER AUTO-CONVERSATION
        // ==========================================

        if (
            targetUser.user_id.toString() ===
            currentUserId.toString()
        ) {
            return res.status(400).json({
                error: 'Vous ne pouvez pas démarrer une discussion avec vous-même.'
            });
        }

        // ==========================================
        // ID CONVERSATION
        // ==========================================

        const conversationId =
            cassandra.types.Uuid.random();

        const now = new Date();

        const currentUserUuid =
            cassandra.types.Uuid.fromString(
                currentUserId
            );

        // ==========================================
        // INSERT
        // ==========================================

        const insertQuery = `
            INSERT INTO chat_app.conversations_by_user (
                user_id,
                conversation_id,
                participant_id,
                participant_username,
                my_username,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // ==========================================
        // UTILISATEUR COURANT
        // ==========================================

        await client.execute(
            insertQuery,
            [
                currentUserUuid,
                conversationId,
                targetUser.user_id,
                targetUser.username,
                currentUsername,
                now
            ],
            {
                prepare: true
            }
        );

        // ==========================================
        // DESTINATAIRE
        // ==========================================

        await client.execute(
            insertQuery,
            [
                targetUser.user_id,
                conversationId,
                currentUserUuid,
                currentUsername,
                targetUser.username,
                now
            ],
            {
                prepare: true
            }
        );

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({
            message: 'Conversation créée avec succès.',

            conversation_id:
                conversationId.toString(),

            participant_id:
                targetUser.user_id.toString(),

            participant_username:
                targetUser.username,

            created_at:
                now.toISOString()
        });

    } catch (error) {

        console.error(
            '❌ Erreur création conversation:',
            error
        );

        return res.status(500).json({
            error: 'Erreur serveur lors de la création de la conversation.',
            details: error.message
        });
    }
});


module.exports = router;