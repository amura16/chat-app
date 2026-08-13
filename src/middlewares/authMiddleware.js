const jwt = require('jsonwebtoken');

// ==========================================
// JWT SECRET
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error(
        '❌ JWT_SECRET n\'est pas défini dans le fichier .env'
    );
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticateToken = (req, res, next) => {
    try {
        // ==========================================
        // RÉCUPÉRER LE HEADER AUTHORIZATION
        // ==========================================

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié (Token manquant).'
            });
        }

        // ==========================================
        // VÉRIFIER FORMAT "Bearer TOKEN"
        // ==========================================

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                error: 'Format du token invalide. Utilisez Bearer <token>.'
            });
        }

        const token = parts[1];

        if (!token) {
            return res.status(401).json({
                error: 'Token manquant.'
            });
        }

        // ==========================================
        // VÉRIFIER LE JWT
        // ==========================================

        jwt.verify(
            token,
            JWT_SECRET,
            (err, decoded) => {
                if (err) {
                    console.error(
                        '❌ Erreur vérification JWT:',
                        err.message
                    );

                    if (err.name === 'TokenExpiredError') {
                        return res.status(401).json({
                            error: 'Token expiré.'
                        });
                    }

                    return res.status(401).json({
                        error: 'Token invalide.'
                    });
                }

                // ==========================================
                // VÉRIFIER LE CONTENU DU TOKEN
                // ==========================================

                if (!decoded.userId) {
                    return res.status(401).json({
                        error: 'Token invalide : userId manquant.'
                    });
                }

                // ==========================================
                // STOCKER L'UTILISATEUR
                // ==========================================

                req.user = {
                    userId: decoded.userId,
                    username: decoded.username
                };

                next();
            }
        );

    } catch (error) {
        console.error(
            '❌ Erreur middleware authentication:',
            error
        );

        return res.status(500).json({
            error: 'Erreur serveur lors de l\'authentification.'
        });
    }
};

module.exports = authenticateToken;