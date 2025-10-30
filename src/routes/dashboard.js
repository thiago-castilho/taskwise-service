const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sprintsController');

router.get('/summary', ctrl.dashboardSummary);

module.exports = router;
