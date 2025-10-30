const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authRequired } = require('../middlewares/auth');

router.post('/login', ctrl.postLogin);
router.get('/me', authRequired, ctrl.getMe);

module.exports = router;
