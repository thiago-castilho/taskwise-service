const { login, createUser } = require('../services/authService');
const usersRepo = require('../repositories/usersRepository');

async function postLogin(req, res, next) {
try {
const { email, password } = req.body || {};
const result = await login(email, password);
res.status(200).json(result);
} catch (e) { next(e); }
}

async function postUser(req, res, next) {
try {
const { name, email, password } = req.body || {};
const user = await createUser({ name, email, password });
res.status(201).json(user);
} catch (e) { next(e); }
}

async function getMe(req, res, next) {
try {
const user = usersRepo.findById(req.user.id);
if (!user) {
return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Usuário não encontrado' }]);
}
// Retorna dados do usuário sem passwordHash
res.status(200).json({
id: user.id,
name: user.name,
email: user.email,
role: user.role,
createdAt: user.createdAt,
});
} catch (e) { next(e); }
}

module.exports = { postLogin, postUser, getMe };
