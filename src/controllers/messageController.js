const MessageModel = require('../models/messageModel');


// ==========================================
// VALIDATION UUID
// ==========================================

function isValidUUID(value) {
    if (typeof value !== 'string') {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


// ==========================================
// RÉCUPÉRER LES MESSAGES
// ==========================================
// GET /api/messages/:conversationId
// ==========================================

exports.getMessages = async (req, res) => {

    try {

        const {
            conversationId
        } = req.params;


        // ==========================================
        // VÉRIFIER AUTHENTIFICATION
        // ==========================================

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });

        }


        // ==========================================
        // VALIDATION CONVERSATION ID
        // ==========================================

        if (!conversationId) {

            return res.status(400).json({
                error: 'conversationId est obligatoire.'
            });

        }


        if (!isValidUUID(conversationId)) {

            return res.status(400).json({
                error: 'conversationId invalide.'
            });

        }


        // ==========================================
        // LIMIT
        // ==========================================

        let limit =
            parseInt(req.query.limit, 10) || 50;

        if (limit < 1) {
            limit = 1;
        }

        if (limit > 100) {
            limit = 100;
        }


        // ==========================================
        // RÉCUPÉRER LES MESSAGES
        // ==========================================

        const messages =
            await MessageModel.getByConversation(
                conversationId,
                limit
            );


        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.json(messages);

    } catch (err) {

        console.error(
            '❌ Erreur récupération messages :',
            err
        );

        return res.status(500).json({

            error:
                'Erreur serveur lors de la récupération des messages.',

            details:
                err.message
        });
    }
};


// ==========================================
// RECHERCHER DES MESSAGES
// ==========================================
// GET /api/messages/:conversationId/search?q=hello
// ==========================================

exports.search = async (req, res) => {

    try {

        const {
            conversationId
        } = req.params;

        const {
            q
        } = req.query;


        // ==========================================
        // VÉRIFIER AUTHENTIFICATION
        // ==========================================

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });

        }


        // ==========================================
        // VALIDATION CONVERSATION ID
        // ==========================================

        if (!conversationId) {

            return res.status(400).json({
                error: 'conversationId est obligatoire.'
            });

        }


        if (!isValidUUID(conversationId)) {

            return res.status(400).json({
                error: 'conversationId invalide.'
            });

        }


        // ==========================================
        // VALIDATION RECHERCHE
        // ==========================================

        if (!q || !q.trim()) {

            return res.status(400).json({
                error: 'Le paramètre de recherche est requis.'
            });

        }


        // ==========================================
        // RECHERCHE
        // ==========================================

        const results =
            await MessageModel.searchMessages(
                conversationId,
                q.trim()
            );


        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.json(results);

    } catch (err) {

        console.error(
            '❌ Erreur recherche messages :',
            err
        );

        return res.status(500).json({

            error:
                'Erreur serveur lors de la recherche des messages.',

            details:
                err.message
        });
    }
};