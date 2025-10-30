const { v4: uuidv4 } = require('uuid');

function requestIdMiddleware(req, res, next) {
const incoming = req.headers['x-request-id'];
const id = (typeof incoming === 'string' && incoming.trim().length > 0) ? incoming : uuidv4();
res.setHeader('x-request-id', id);
next();
}

module.exports = { requestIdMiddleware };
