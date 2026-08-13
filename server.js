const express = require('express');
const http = require('http');
require('dotenv').config();

const cors = require('cors');

// ==========================================
// CONFIGURATION WEBSOCKET
// ==========================================

const webSocketConfig = require('./config/websocket');
const chatSocketHandler = require('./src/sockets/chatHandler');

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require('./src/routes/authRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const userRoutes = require('./src/routes/userRoutes');

// ==========================================
// CASSANDRA
// ==========================================

const initializeDatabase = require('./config/initCassandra');

// ==========================================
// EXPRESS
// ==========================================

const app = express();

const server = http.createServer(app);

// ==========================================
// CORS
// ==========================================

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(express.json());

// ==========================================
// SOCKET.IO
// ==========================================

const io = webSocketConfig.init(server);

chatSocketHandler(io);

// ==========================================
// ROUTES API
// ==========================================

app.use('/api/auth', authRoutes);

app.use('/api/conversations', conversationRoutes);

app.use('/api/messages', messageRoutes);

app.use('/api/users', userRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/', (req, res) => {
    res.json({
        message: 'Chat API is running',
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
    });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

async function startServer() {
    try {
        console.log('🔄 Initialisation de Cassandra...');

        // Connexion + création du keyspace + tables
        await initializeDatabase();

        console.log('✅ Cassandra initialisée avec succès');

        // ==========================================
        // PORT
        // ==========================================

        const PORT = process.env.PORT || 3000;

        // ==========================================
        // DÉMARRAGE EXPRESS
        // ==========================================

        server.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('==========================================');
            console.log('🚀 SERVEUR DÉMARRÉ');
            console.log('==========================================');
            console.log(`📡 Port : ${PORT}`);
            console.log(`🌐 API : http://localhost:${PORT}`);
            console.log(`❤️  Health : http://localhost:${PORT}/health`);
            console.log('💾 Cassandra : Connectée');
            console.log('==========================================');
            console.log('');
        });

    } catch (error) {
        console.error('');
        console.error('==========================================');
        console.error('❌ IMPOSSIBLE DE DÉMARRER LE SERVEUR');
        console.error('==========================================');
        console.error(error);
        console.error('==========================================');

        process.exit(1);
    }
}

// ==========================================
// LANCEMENT
// ==========================================

startServer();