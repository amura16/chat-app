const cassandra = require('cassandra-driver');
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
// SOCKET HANDLER
// ==========================================

module.exports = (io) => {

    io.on('connection', (socket) => {

        console.log(
            '🔌 Nouveau client connecté au Socket :',
            socket.id
        );


        // ==========================================
        // REJOINDRE UNE CONVERSATION
        // ==========================================

        socket.on(
            'join_conversation',
            (conversationId) => {

                try {

                    if (!conversationId) {
                        console.error(
                            '❌ conversationId manquant'
                        );

                        return;
                    }


                    const conversationIdString =
                        conversationId.toString();


                    if (!isValidUUID(conversationIdString)) {

                        console.error(
                            '❌ conversationId invalide :',
                            conversationIdString
                        );

                        return;
                    }


                    // Rejoindre la room
                    socket.join(
                        conversationIdString
                    );


                    console.log(
                        `👤 Socket ${socket.id} a rejoint la conversation : ${conversationIdString}`
                    );

                } catch (error) {

                    console.error(
                        '❌ Erreur join_conversation :',
                        error
                    );
                }
            }
        );


        // ==========================================
        // ENVOYER UN MESSAGE
        // ==========================================

        socket.on(
            'send_message',
            async (data) => {

                console.log(
                    '📩 Message reçu sur le serveur Socket :',
                    data
                );


                try {

                    const {
                        conversation_id,
                        sender_id,
                        sender_username,
                        content
                    } = data;


                    // ==========================================
                    // VALIDATION
                    // ==========================================

                    if (
                        !conversation_id ||
                        !sender_id ||
                        !content ||
                        !content.trim()
                    ) {

                        console.error(
                            '❌ Données du message incomplètes'
                        );

                        socket.emit(
                            'message_error',
                            {
                                error:
                                    'conversation_id, sender_id et content sont obligatoires.'
                            }
                        );

                        return;
                    }


                    const conversationIdString =
                        conversation_id.toString();

                    const senderIdString =
                        sender_id.toString();


                    // ==========================================
                    // VALIDATION UUID
                    // ==========================================

                    if (
                        !isValidUUID(
                            conversationIdString
                        )
                    ) {

                        socket.emit(
                            'message_error',
                            {
                                error:
                                    'conversation_id invalide.'
                            }
                        );

                        return;
                    }


                    if (
                        !isValidUUID(
                            senderIdString
                        )
                    ) {

                        socket.emit(
                            'message_error',
                            {
                                error:
                                    'sender_id invalide.'
                            }
                        );

                        return;
                    }


                    // ==========================================
                    // CRÉER LE MESSAGE
                    // ==========================================

                    const message =
                        await MessageModel.createMessage({
                            conversationId:
                                conversationIdString,

                            senderId:
                                senderIdString,

                            senderUsername:
                                sender_username || 'Inconnu',

                            content:
                                content.trim()
                        });


                    console.log(
                        '✅ Message enregistré dans Cassandra :',
                        message.message_id
                    );


                    // ==========================================
                    // DIFFUSER LE MESSAGE
                    // ==========================================

                    io
                        .to(conversationIdString)
                        .emit(
                            'receive_message',
                            message
                        );


                    console.log(
                        `📤 Message envoyé à la room ${conversationIdString}`
                    );


                } catch (error) {

                    console.error(
                        '❌ Erreur lors de l’enregistrement du message :',
                        error
                    );


                    socket.emit(
                        'message_error',
                        {
                            error:
                                'Impossible d\'enregistrer le message.',
                            details:
                                error.message
                        }
                    );
                }
            }
        );


        // ==========================================
        // DÉCONNEXION
        // ==========================================

        socket.on(
            'disconnect',
            (reason) => {

                console.log(
                    `🔌 Socket ${socket.id} déconnecté : ${reason}`
                );

            }
        );

    });
};