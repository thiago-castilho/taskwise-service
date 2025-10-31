const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tasksController');
const { requireAdmin } = require('../middlewares/auth');

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.patchStatus);
router.patch('/:id/assign/:userId', ctrl.assign);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
