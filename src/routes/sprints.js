const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sprintsController');
const { requireAdmin } = require('../middlewares/auth');

router.post('/', requireAdmin, ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.patch('/:id/capacity', requireAdmin, ctrl.setCapacity);
router.patch('/:id/tasks', requireAdmin, ctrl.addTasks);
router.patch('/:id/tasks/remove', requireAdmin, ctrl.removeTasks);
router.patch('/:id/start', requireAdmin, ctrl.start);
router.patch('/:id/close', requireAdmin, ctrl.close);

module.exports = router;
