const { v4: uuidv4 } = require('uuid');
const { toUtcIso, addBusinessDaysFromNextDay } = require('../utils/time');
const { computeTaskTotals } = require('../utils/pert');
const tasksRepo = require('../repositories/tasksRepository');
const usersRepo = require('../repositories/usersRepository');

const VALID_STATUSES = ['Backlog', 'Em Andamento', 'Bloqueada', 'Concluída'];

function computeDueDateForTask(createdAtIso, totalDays) {
return addBusinessDaysFromNextDay(createdAtIso, totalDays);
}

function withTotals(task) {
const totals = computeTaskTotals(task.phases);
task._totalsCache = totals;
task.totalHours = totals.totalHours;
task.totalDays = totals.totalDays;
task.dueDate = computeDueDateForTask(task.createdAt, totals.totalDays);
return task;
}

function createTask(payload, creatorId) {
const { title, description, phases, risco, complexidade, sprintId = null } = payload;
const task = {
id: uuidv4(),
title,
description: description || null,
phases,
status: 'Backlog',
assigneeId: null,
block: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
sprintId,
risco: risco || null,
complexidade: complexidade || null,
createdBy: creatorId,
};
withTotals(task);
tasksRepo.add(task);
return task;
}

function listTasks(filters = {}, page = 1, pageSize = 20) {
let all = tasksRepo.listAll();
if (filters.status) all = all.filter(t => t.status === filters.status);
if (filters.sprintId) all = all.filter(t => t.sprintId === filters.sprintId);
if (filters.risco) all = all.filter(t => t.risco === filters.risco);
if (filters.complexidade) all = all.filter(t => t.complexidade === filters.complexidade);
if (filters.assigneeId) all = all.filter(t => t.assigneeId === filters.assigneeId);
const total = all.length;
const totalPages = Math.max(1, Math.ceil(total / pageSize));
const start = (page - 1) * pageSize;
const items = all.slice(start, start + pageSize);
return { items, page, pageSize, total, totalPages };
}

function getTask(id) {
const t = tasksRepo.findById(id);
if (!t) return null;
if (!t._totalsCache) withTotals(t);
return t;
}

function updateTask(id, payload) {
const task = getTask(id);
if (!task) return null;
if (payload.title !== undefined) task.title = payload.title;
if (payload.description !== undefined) task.description = payload.description;
if (payload.phases !== undefined) {
task.phases = payload.phases;
withTotals(task);
}
if (payload.risco !== undefined) task.risco = payload.risco;
if (payload.complexidade !== undefined) task.complexidade = payload.complexidade;
if (payload.sprintId !== undefined) task.sprintId = payload.sprintId;
task.updatedAt = toUtcIso();
tasksRepo.update(task);
return task;
}

function setAssignee(taskId, userId) {
const task = getTask(taskId);
if (!task) return null;
const user = usersRepo.findById(userId);
if (!user) {
const err = new Error('Responsável inexistente');
err.status = 422;
err.errors = [{ code: 'ASSIGNEE_NOT_FOUND', field: 'userId', message: 'Usuário não existe' }];
throw err;
}
task.assigneeId = user.id;
task.updatedAt = toUtcIso();
tasksRepo.update(task);
return task;
}

function transitionStatus(taskId, newStatus, blockInfo) {
const task = getTask(taskId);
if (!task) return null;
const from = task.status;
if (!VALID_STATUSES.includes(newStatus)) {
const err = new Error('Status inválido');
err.status = 422;
err.errors = [{ code: 'INVALID_STATUS', field: 'status', message: 'Status inválido' }];
throw err;
}
// Regras de transição
if (from === 'Backlog' && newStatus !== 'Em Andamento') invalidTransition();
if (from === 'Em Andamento' && !['Bloqueada', 'Concluída'].includes(newStatus)) invalidTransition();
if (from === 'Bloqueada' && newStatus !== 'Em Andamento') invalidTransition();
if (from === 'Concluída') invalidTransition();

function invalidTransition() {
const err = new Error('Transição de status inválida');
err.status = 422;
err.errors = [{ code: 'INVALID_TRANSITION', field: 'status', message: `${from} -> ${newStatus}` }];
throw err;
}

if (newStatus === 'Concluída') {
if (!task.assigneeId) {
const err = new Error('Concluir exige responsável');
err.status = 409;
err.errors = [{ code: 'MISSING_ASSIGNEE', field: 'assigneeId', message: 'Defina responsável antes de concluir' }];
throw err;
}
// valida PERT (withTotals já valida)
withTotals(task);
}

if (newStatus === 'Bloqueada') {
const { motivo, responsavelId } = blockInfo || {};
if (!motivo || !responsavelId) {
const err = new Error('Bloqueio requer motivo e responsável');
err.status = 422;
err.errors = [{ code: 'BLOCK_INFO_REQUIRED', field: 'block', message: 'Informe motivo e responsável' }];
throw err;
}
const user = usersRepo.findById(responsavelId);
if (!user) {
const err = new Error('Responsável do bloqueio inexistente');
err.status = 422;
err.errors = [{ code: 'BLOCK_RESP_NOT_FOUND', field: 'responsavelId', message: 'Usuário não existe' }];
throw err;
}
task.block = { motivo, responsavelId, blockedAt: toUtcIso(), resolvedAt: null };
}

if (from === 'Bloqueada' && newStatus === 'Em Andamento') {
if (task.block && !task.block.resolvedAt) {
task.block.resolvedAt = toUtcIso();
}
}

task.status = newStatus;
task.updatedAt = toUtcIso();
tasksRepo.update(task);
return task;
}

module.exports = {
createTask,
listTasks,
getTask,
updateTask,
setAssignee,
transitionStatus,
};
