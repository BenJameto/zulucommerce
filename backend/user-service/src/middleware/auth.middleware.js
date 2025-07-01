const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'secreto', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
}; 