const db = require('../../config/database');
const { types } = require('cassandra-driver');

class ConversationModel {

    // ==========================================
    // CRÉER UNE CONVERSATION
    // ==========================================

    static async createConversation(
        userId,
        participantId,
        participantUsername,
        myUsername
    ) {
        try {
            const conversationId = types.Uuid.random();
            const now = new Date();

            // ==========================================
            // CONVERSATION POUR L'UTILISATEUR CONNECTÉ
            // ==========================================

            const query = `
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

            await db.execute(
                query,
                [
                    types.Uuid.fromString(userId),
                    conversationId,
                    types.Uuid.fromString(participantId),
                    participantUsername,
                    myUsername,
                    now
                ],
                {
                    prepare: true
                }
            );

            // ==========================================
            // CONVERSATION POUR LE PARTICIPANT
            // ==========================================

            await db.execute(
                query,
                [
                    types.Uuid.fromString(participantId),
                    conversationId,
                    types.Uuid.fromString(userId),
                    myUsername,
                    participantUsername,
                    now
                ],
                {
                    prepare: true
                }
            );

            console.log(
                `✅ Conversation créée : ${conversationId.toString()}`
            );

            return conversationId;

        } catch (error) {
            console.error(
                '❌ Erreur création conversation :',
                error
            );

            throw error;
        }
    }


    // ==========================================
    // RÉCUPÉRER LES CONVERSATIONS D'UN UTILISATEUR
    // ==========================================

    static async getUserConversations(userId) {
        try {

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

            const result = await db.execute(
                query,
                [
                    types.Uuid.fromString(userId)
                ],
                {
                    prepare: true
                }
            );

            return result.rows;

        } catch (error) {

            console.error(
                '❌ Erreur récupération conversations :',
                error
            );

            throw error;
        }
    }


    // ==========================================
    // RÉCUPÉRER UNE CONVERSATION
    // ==========================================

    static async getConversation(
        userId,
        conversationId
    ) {
        try {

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

            const result = await db.execute(
                query,
                [
                    types.Uuid.fromString(userId)
                ],
                {
                    prepare: true
                }
            );

            const conversation = result.rows.find(
                (row) =>
                    row.conversation_id.toString() ===
                    conversationId
            );

            return conversation || null;

        } catch (error) {

            console.error(
                '❌ Erreur récupération conversation :',
                error
            );

            throw error;
        }
    }


    // ==========================================
    // SUPPRIMER UNE CONVERSATION
    // ==========================================

    static async deleteConversation(
        userId,
        conversationId,
        createdAt
    ) {
        try {

            const query = `
                DELETE FROM chat_app.conversations_by_user
                WHERE user_id = ?
                AND created_at = ?
                AND conversation_id = ?
            `;

            await db.execute(
                query,
                [
                    types.Uuid.fromString(userId),
                    new Date(createdAt),
                    types.Uuid.fromString(conversationId)
                ],
                {
                    prepare: true
                }
            );

            console.log(
                `✅ Conversation supprimée : ${conversationId}`
            );

        } catch (error) {

            console.error(
                '❌ Erreur suppression conversation :',
                error
            );

            throw error;
        }
    }
}

module.exports = ConversationModel;