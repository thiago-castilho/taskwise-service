const { users } = require('./db');

function findByEmail(email) {
return users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

function findById(id) {
return users.find(u => u.id === id);
}

function add(user) {
users.push(user);
return user;
}

function list() {
return users.slice();
}

module.exports = { findByEmail, findById, add, list };
