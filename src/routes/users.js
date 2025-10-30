const express = require('express');
const router = express.Router();
const { authRequired, requireAdmin } = require('../middlewares/auth');
const authCtrl = require('../controllers/authController');
const usersCtrl = require('../controllers/usersController');

router.post('/', authCtrl.postUser);
router.get('/', authRequired, requireAdmin, usersCtrl.listAll);
router.get('/me', authRequired, authCtrl.getMe);

module.exports = router;
