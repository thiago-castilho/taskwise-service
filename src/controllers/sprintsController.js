const service = require('../services/sprintsService');

async function create(req, res, next) {
try {
const sprint = service.createSprint(req.body || {});
res.status(201).json(sprint);
} catch (e) { next(e); }
}

async function setCapacity(req, res, next) {
try {
const sprint = service.setCapacity(req.params.id, req.body || {});
if (!sprint) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(sprint);
} catch (e) { next(e); }
}

async function start(req, res, next) {
try {
const sprint = service.startSprint(req.params.id);
if (!sprint) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(sprint);
} catch (e) { next(e); }
}

async function close(req, res, next) {
try {
const sprint = service.closeSprint(req.params.id);
if (!sprint) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(sprint);
} catch (e) { next(e); }
}

async function list(req, res, next) {
try {
res.status(200).json({ items: service.listSprints() });
} catch (e) { next(e); }
}

async function getById(req, res, next) {
try {
const s = service.getSprint(req.params.id);
if (!s) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(s);
} catch (e) { next(e); }
}

async function dashboardSummary(req, res, next) {
try {
const summary = service.summaryDashboard(req.query.sprintId);
if (!summary) return res.status(404).json([{ code: 'NOT_FOUND', field: 'sprintId', message: 'Sprint não encontrada' }]);
res.status(200).json(summary);
} catch (e) { next(e); }
}

async function addTasks(req, res, next) {
try {
const sprint = service.addTasksToSprint(req.params.id, req.body?.taskIds || []);
if (!sprint) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(sprint);
} catch (e) { next(e); }
}

async function removeTasks(req, res, next) {
try {
const sprint = service.removeTasksFromSprint(req.params.id, req.body?.taskIds || []);
if (!sprint) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Sprint não encontrada' }]);
res.status(200).json(sprint);
} catch (e) { next(e); }
}

module.exports = { create, setCapacity, start, close, list, getById, dashboardSummary, addTasks, removeTasks };
