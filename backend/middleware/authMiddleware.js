const admin = require('../firebaseAdmin');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token.' });
  }
}

module.exports = authMiddleware;
