const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findByEmail, add } = require('../repositories/usersRepository');
const { JWT_SECRET } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');
const { toUtcIso } = require('../utils/time');

async function login(email, password) {
const user = findByEmail(email);
if (!user) {
const err = new Error('Credenciais inválidas');
err.status = 401;
err.errors = [{ code: 'INVALID_CREDENTIALS', field: 'email', message: 'Usuário não encontrado' }];
throw err;
}
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) {
const err = new Error('Credenciais inválidas');
err.status = 401;
err.errors = [{ code: 'INVALID_CREDENTIALS', field: 'password', message: 'Senha inválida' }];
throw err;
}
const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

async function createUser({ name, email, password }) {
if (findByEmail(email)) {
const err = new Error('E-mail já cadastrado');
err.status = 422;
err.errors = [{ code: 'EMAIL_IN_USE', field: 'email', message: 'E-mail já cadastrado' }];
throw err;
}
const passwordHash = await bcrypt.hash(password, 8);
const user = { id: uuidv4(), name, email, passwordHash, role: 'ReadWrite', createdAt: toUtcIso() };
add(user);
return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

module.exports = { login, createUser };
