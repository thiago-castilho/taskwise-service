const service = require('../services/tasksService');

function parsePagination(req) {
const page = Math.max(1, Number(req.query.page || 1));
const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize || 20)));
return { page, pageSize };
}

async function create(req, res, next) {
try {
const task = service.createTask(req.body, req.user.id);
res.status(201).json(task);
} catch (e) { next(e); }
}

async function list(req, res, next) {
try {
const filters = {
status: req.query.status,
sprintId: req.query.sprintId,
risco: req.query.risco,
complexidade: req.query.complexidade,
assigneeId: req.query.assigneeId,
};
const { page, pageSize } = parsePagination(req);
const result = service.listTasks(filters, page, pageSize);
res.status(200).json(result);
} catch (e) { next(e); }
}

async function getById(req, res, next) {
try {
const t = service.getTask(req.params.id);
if (!t) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Tarefa não encontrada' }]);
res.status(200).json(t);
} catch (e) { next(e); }
}

async function update(req, res, next) {
try {
const t = service.updateTask(req.params.id, req.body || {});
if (!t) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Tarefa não encontrada' }]);
res.status(200).json(t);
} catch (e) { next(e); }
}

async function patchStatus(req, res, next) {
try {
const t = service.transitionStatus(req.params.id, req.body?.status, req.body?.block);
if (!t) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Tarefa não encontrada' }]);
res.status(200).json(t);
} catch (e) { next(e); }
}

async function assign(req, res, next) {
try {
const t = service.setAssignee(req.params.id, req.params.userId);
if (!t) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Tarefa não encontrada' }]);
res.status(200).json(t);
} catch (e) { next(e); }
}

async function remove(req, res, next) {
try {
const result = service.deleteTask(req.params.id);
if (!result) return res.status(404).json([{ code: 'NOT_FOUND', field: 'id', message: 'Tarefa não encontrada' }]);
return res.status(204).send();
} catch (e) { next(e); }
}

module.exports = { create, list, getById, update, patchStatus, assign, remove };
