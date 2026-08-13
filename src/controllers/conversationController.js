const cassandra = require('cassandra-driver');
const ConversationModel = require('../models/conversationModel');


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
// CRÉER UNE CONVERSATION
// ==========================================

exports.createConversation = async (req, res) => {

    try {

        const {
            participantId,
            participantUsername
        } = req.body;

        // ==========================================
        // UTILISATEUR CONNECTÉ
        // ==========================================

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });
        }

        const userId = req.user.userId;

        const myUsername = req.user.username;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!participantId) {
            return res.status(400).json({
                error: 'participantId est obligatoire.'
            });
        }

        if (!participantUsername) {
            return res.status(400).json({
                error: 'participantUsername est obligatoire.'
            });
        }


        // ==========================================
        // VALIDATION UUID UTILISATEUR
        // ==========================================

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                error: 'userId invalide.'
            });
        }


        // ==========================================
        // VALIDATION UUID PARTICIPANT
        // ==========================================

        if (!isValidUUID(participantId)) {
            return res.status(400).json({
                error: 'participantId invalide.'
            });
        }


        // ==========================================
        // EMPÊCHER CONVERSATION AVEC SOI-MÊME
        // ==========================================

        if (userId === participantId) {
            return res.status(400).json({
                error: 'Vous ne pouvez pas créer une conversation avec vous-même.'
            });
        }


        // ==========================================
        // CRÉER LA CONVERSATION
        // ==========================================

        const conversationId =
            await ConversationModel.createConversation(
                userId,
                participantId,
                participantUsername,
                myUsername
            );


        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.status(201).json({

            message: 'Conversation créée avec succès.',

            conversationId:
                conversationId.toString()
        });


    } catch (err) {

        console.error(
            '❌ Erreur création conversation :',
            err
        );

        return res.status(500).json({

            error: 'Erreur serveur lors de la création de la conversation.',

            details: err.message
        });
    }
};


// ==========================================
// RÉCUPÉRER LES CONVERSATIONS
// ==========================================

exports.getUserConversations = async (req, res) => {

    try {

        // ==========================================
        // VÉRIFIER AUTHENTIFICATION
        // ==========================================

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                error: 'Utilisateur non authentifié.'
            });

        }

        const userId = req.user.userId;


        // ==========================================
        // VALIDATION UUID
        // ==========================================

        if (!isValidUUID(userId)) {

            return res.status(400).json({
                error: 'userId invalide.'
            });

        }


        // ==========================================
        // RÉCUPÉRER LES CONVERSATIONS
        // ==========================================

        const conversations =
            await ConversationModel.getUserConversations(
                userId
            );


        // ==========================================
        // CONVERSION UUID → STRING
        // ==========================================

        const formattedConversations =
            conversations.map(conversation => ({

                user_id:
                    conversation.user_id
                        ? conversation.user_id.toString()
                        : null,

                conversation_id:
                    conversation.conversation_id
                        ? conversation.conversation_id.toString()
                        : null,

                participant_id:
                    conversation.participant_id
                        ? conversation.participant_id.toString()
                        : null,

                participant_username:
                    conversation.participant_username || null,

                my_username:
                    conversation.my_username || null,

                created_at:
                    conversation.created_at
                        ? conversation.created_at.toISOString()
                        : null
            }));


        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.json(
            formattedConversations
        );


    } catch (err) {

        console.error(
            '❌ Erreur récupération conversations :',
            err
        );

        return res.status(500).json({

            error:
                'Erreur serveur lors de la récupération des conversations.',

            details:
                err.message
        });
    }
};