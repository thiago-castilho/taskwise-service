const jwt = require('jsonwebtoken');
const { users } = require('../repositories/db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskwise-dev-secret';

function authRequired(req, res, next) {
const header = req.headers['authorization'] || '';
const token = header.startsWith('Bearer ') ? header.substring(7) : null;
if (!token) {
return res.status(401).json([{ code: 'UNAUTHORIZED', field: null, message: 'Token ausente' }]);
}
try {
const payload = jwt.verify(token, JWT_SECRET);
const user = users.find(u => u.id === payload.sub);
if (!user) {
return res.status(401).json([{ code: 'UNAUTHORIZED', field: null, message: 'Usuário inválido' }]);
}
req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
next();
} catch (e) {
return res.status(401).json([{ code: 'UNAUTHORIZED', field: null, message: 'Token inválido' }]);
}
}

function requireAdmin(req, res, next) {
if (!req.user || req.user.role !== 'Admin') {
return res.status(403).json([{ code: 'FORBIDDEN', field: null, message: 'Acesso restrito a Admin' }]);
}
next();
}

module.exports = { authRequired, requireAdmin, JWT_SECRET };
