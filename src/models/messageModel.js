const db = require('../../config/database');
const { types } = require('cassandra-driver');

class MessageModel {

    // ==========================================
    // VALIDATION UUID
    // ==========================================

    static isValidUUID(value) {
        if (typeof value !== 'string') {
            return false;
        }

        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }


    // ==========================================
    // CRÉER UN MESSAGE
    // ==========================================

    static async createMessage({
        conversationId,
        senderId,
        senderUsername,
        content
    }) {

        if (!this.isValidUUID(conversationId)) {
            throw new Error('conversationId invalide');
        }

        if (!this.isValidUUID(senderId)) {
            throw new Error('senderId invalide');
        }

        if (!content || !content.trim()) {
            throw new Error('Le contenu du message est vide');
        }

        const messageId = types.Uuid.random();
        const now = new Date();

        const query = `
            INSERT INTO chat_app.messages_by_conversation (
                conversation_id,
                message_id,
                sender_id,
                sender_username,
                content,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await db.execute(
            query,
            [
                types.Uuid.fromString(conversationId),
                messageId,
                types.Uuid.fromString(senderId),
                senderUsername,
                content.trim(),
                now
            ],
            {
                prepare: true
            }
        );

        return {
            message_id: messageId.toString(),
            conversation_id: conversationId,
            sender_id: senderId,
            sender_username: senderUsername,
            content: content.trim(),
            created_at: now.toISOString()
        };
    }


    // ==========================================
    // RÉCUPÉRER LES MESSAGES
    // ==========================================

    static async getByConversation(
        conversationId,
        limit = 50
    ) {

        if (!this.isValidUUID(conversationId)) {
            throw new Error('conversationId invalide');
        }

        // Empêcher des limites absurdes
        limit = Math.min(
            Math.max(parseInt(limit, 10) || 50, 1),
            100
        );

        const query = `
            SELECT
                conversation_id,
                message_id,
                sender_id,
                sender_username,
                content,
                created_at
            FROM chat_app.messages_by_conversation
            WHERE conversation_id = ?
            LIMIT ?
        `;

        const result = await db.execute(
            query,
            [
                types.Uuid.fromString(conversationId),
                limit
            ],
            {
                prepare: true
            }
        );

        return result.rows.map(message => ({
            conversation_id:
                message.conversation_id
                    ? message.conversation_id.toString()
                    : null,

            message_id:
                message.message_id
                    ? message.message_id.toString()
                    : null,

            sender_id:
                message.sender_id
                    ? message.sender_id.toString()
                    : null,

            sender_username:
                message.sender_username,

            content:
                message.content,

            created_at:
                message.created_at
                    ? message.created_at.toISOString()
                    : null
        }));
    }


    // ==========================================
    // RECHERCHER DES MESSAGES
    // ==========================================

    static async searchMessages(
        conversationId,
        keyword
    ) {

        if (!this.isValidUUID(conversationId)) {
            throw new Error('conversationId invalide');
        }

        if (!keyword || !keyword.trim()) {
            return [];
        }

        const query = `
            SELECT
                conversation_id,
                message_id,
                sender_id,
                sender_username,
                content,
                created_at
            FROM chat_app.messages_by_conversation
            WHERE conversation_id = ?
        `;

        const result = await db.execute(
            query,
            [
                types.Uuid.fromString(conversationId)
            ],
            {
                prepare: true
            }
        );

        const search =
            keyword.trim().toLowerCase();

        return result.rows
            .filter(message => {

                if (!message.content) {
                    return false;
                }

                return message.content
                    .toLowerCase()
                    .includes(search);
            })
            .map(message => ({
                conversation_id:
                    message.conversation_id
                        ? message.conversation_id.toString()
                        : null,

                message_id:
                    message.message_id
                        ? message.message_id.toString()
                        : null,

                sender_id:
                    message.sender_id
                        ? message.sender_id.toString()
                        : null,

                sender_username:
                    message.sender_username,

                content:
                    message.content,

                created_at:
                    message.created_at
                        ? message.created_at.toISOString()
                        : null
            }));
    }


    // ==========================================
    // SUPPRIMER UN MESSAGE
    // ==========================================

    static async deleteMessage(
        conversationId,
        createdAt,
        messageId
    ) {

        if (!this.isValidUUID(conversationId)) {
            throw new Error('conversationId invalide');
        }

        if (!this.isValidUUID(messageId)) {
            throw new Error('messageId invalide');
        }

        const query = `
            DELETE FROM chat_app.messages_by_conversation
            WHERE conversation_id = ?
            AND created_at = ?
            AND message_id = ?
        `;

        await db.execute(
            query,
            [
                types.Uuid.fromString(conversationId),
                new Date(createdAt),
                types.Uuid.fromString(messageId)
            ],
            {
                prepare: true
            }
        );

        return true;
    }
}


module.exports = MessageModel;