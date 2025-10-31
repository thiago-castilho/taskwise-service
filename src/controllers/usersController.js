const usersRepo = require('../repositories/usersRepository');

async function listAll(req, res, next) {
	try {
		const users = usersRepo.list();
		return res.status(200).json({ items: users });
	} catch (e) { next(e); }
}

async function listAvailable(req, res, next) {
	try {
		const users = usersRepo.list();
		// Retorna apenas campos básicos, sem passwordHash
		const publicUsers = users.map(u => ({
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role,
		}));
		return res.status(200).json({ items: publicUsers });
	} catch (e) { next(e); }
}

module.exports = { listAll, listAvailable };


