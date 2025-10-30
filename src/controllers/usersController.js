const usersRepo = require('../repositories/usersRepository');

async function listAll(req, res, next) {
	try {
		const users = usersRepo.list();
		return res.status(200).json({ items: users });
	} catch (e) { next(e); }
}

module.exports = { listAll };


