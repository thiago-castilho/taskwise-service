const express = require('express');
const router = express.Router();
const { seed } = require('../repositories/db');
const { authRequired, requireAdmin } = require('../middlewares/auth');

seed();

// Docs (Swagger) - carregado aqui
router.use('/docs', require('./swagger'));

// Auth & Users
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));

// Tasks, Sprints, Dashboard
router.use('/tasks', authRequired, require('./tasks'));
router.use('/sprints', authRequired, require('./sprints'));
router.use('/dashboard', authRequired, require('./dashboard'));

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

module.exports = router;
