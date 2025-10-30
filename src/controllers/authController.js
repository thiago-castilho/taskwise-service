const { login, createUser } = require('../services/authService');

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
res.status(200).json(req.user);
} catch (e) { next(e); }
}

module.exports = { postLogin, postUser, getMe };
