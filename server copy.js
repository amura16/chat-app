const express = require('express');
const http = require('http');
require('dotenv').config();

const webSocketConfig = require('./config/websocket');
const chatSocketHandler = require('./src/sockets/chatHandler');

const authRoutes = require('./src/routes/authRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const userRoutes = require('./src/routes/userRoutes');

const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:5173', // Remplacez par l'URL exacte de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Initialisation de Socket.io
const io = webSocketConfig.init(server);
chatSocketHandler(io);

// Middlewares globaux
app.use(express.json());

// Enregistrement des routes API
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});