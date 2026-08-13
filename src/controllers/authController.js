const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// ==========================================
// REGISTER
// ==========================================

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Username, email et password sont obligatoires'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Normalisation de l'email
        const normalizedEmail = email.trim().toLowerCase();

        // ==========================================
        // VÉRIFIER SI L'UTILISATEUR EXISTE
        // ==========================================

        const existingUser = await UserModel.findByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(400).json({
                error: 'Email déjà utilisé'
            });
        }

        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const passwordHash = await bcrypt.hash(password, 10);

        // ==========================================
        // CRÉER UTILISATEUR
        // ==========================================

        const userId = await UserModel.create({
            username: username.trim(),
            email: normalizedEmail,
            passwordHash
        });

        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.status(201).json({
            message: 'Utilisateur créé',
            userId
        });

    } catch (err) {
        console.error('❌ Erreur register :', err);

        return res.status(500).json({
            error: 'Erreur serveur',
            details: err.message
        });
    }
};


// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email et password sont obligatoires'
            });
        }

        // Normalisation
        const normalizedEmail = email.trim().toLowerCase();

        // ==========================================
        // RECHERCHER UTILISATEUR
        // ==========================================

        const user = await UserModel.findByEmail(normalizedEmail);

        if (!user) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        // ==========================================
        // VÉRIFIER PASSWORD
        // ==========================================

        const isValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isValid) {
            return res.status(401).json({
                error: 'Mot de passe incorrect'
            });
        }

        // ==========================================
        // JWT
        // ==========================================

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error(
                'JWT_SECRET n\'est pas configuré dans le fichier .env'
            );
        }

        const token = jwt.sign(
            {
                userId: user.user_id.toString(),
                username: user.username
            },
            jwtSecret,
            {
                expiresIn: '24h'
            }
        );

        // ==========================================
        // RÉPONSE
        // ==========================================

        return res.json({
            message: 'Connexion réussie',
            token,
            userId: user.user_id.toString(),
            username: user.username
        });

    } catch (err) {
        console.error('❌ Erreur login :', err);

        return res.status(500).json({
            error: 'Erreur serveur',
            details: err.message
        });
    }
};