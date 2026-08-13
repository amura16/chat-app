const express = require('express');

const router = express.Router();

const messageController = require('../controllers/messageController');
const authenticateToken = require('../middlewares/authMiddleware');


// =====================================================
// AUTHENTIFICATION
// Toutes les routes messages nécessitent un JWT
// =====================================================

router.use(authenticateToken);


// =====================================================
// GET /api/messages/:conversationId
// Récupérer les messages d'une conversation
// =====================================================

router.get(
    '/:conversationId',
    messageController.getMessages
);


// =====================================================
// GET /api/messages/:conversationId/search?q=...
// Rechercher des messages
// =====================================================

router.get(
    '/:conversationId/search',
    messageController.search
);


module.exports = router;