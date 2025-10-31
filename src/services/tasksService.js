const { v4: uuidv4 } = require('uuid');
const { toUtcIso, addBusinessDaysFromNextDay, endOfWorkdayUtc } = require('../utils/time');
const { computeTaskTotals } = require('../utils/pert');
const tasksRepo = require('../repositories/tasksRepository');
const sprintsRepo = require('../repositories/sprintsRepository');
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
  // dueDate só é definida quando status mudar para 'Em Andamento'
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
// Se a tarefa já está "Em Andamento" e tem dueDate, recalcula com nova estimativa
if (task.status === 'Em Andamento' && task.dueDate) {
  const days = Math.max(1, Math.round(Number(task.totalDays) || 1));
  const target = computeDueDateForTask(toUtcIso(), days);
  task.dueDate = endOfWorkdayUtc(target, 18, 0);
}
}
if (payload.risco !== undefined) task.risco = payload.risco;
if (payload.complexidade !== undefined) task.complexidade = payload.complexidade;
  if (payload.sprintId !== undefined) {
    const newSprintId = payload.sprintId || null;
    // Exclusividade: não permitir reatribuir se já possui sprintId diferente
    if (newSprintId && task.sprintId && task.sprintId !== newSprintId) {
      const err = new Error('Tarefa já vinculada a outra sprint');
      err.status = 409;
      err.errors = [{ code: 'TASK_ALREADY_IN_SPRINT', field: 'sprintId', message: 'Remova da sprint atual antes de reatribuir' }];
      throw err;
    }
    // Validar sprint destino existe
    if (newSprintId) {
      const sprint = sprintsRepo.findById(newSprintId);
      if (!sprint) {
        const err = new Error('Sprint destino inexistente');
        err.status = 422;
        err.errors = [{ code: 'SPRINT_NOT_FOUND', field: 'sprintId', message: 'Sprint informada não existe' }];
        throw err;
      }
      // Garantir que a lista da sprint contenha a tarefa (sincronismo)
      if (!sprint.taskIds.includes(task.id)) {
        sprint.taskIds.push(task.id);
        sprint.updatedAt = toUtcIso();
        sprintsRepo.update(sprint);
      }
    }
    // Se removendo sprintId, também remover da lista da sprint anterior
    if (!newSprintId && task.sprintId) {
      const prev = sprintsRepo.findById(task.sprintId);
      if (prev) {
        prev.taskIds = prev.taskIds.filter(tid => tid !== task.id);
        prev.updatedAt = toUtcIso();
        sprintsRepo.update(prev);
      }
    }
    task.sprintId = newSprintId;
  }
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
  // Regra: tarefas sem sprintId só podem ter status Backlog
  if (!task.sprintId && newStatus !== 'Backlog') {
    const err = new Error('Tarefas sem sprint devem permanecer em Backlog');
    err.status = 422;
    err.errors = [{ code: 'STATUS_INVALID_FOR_TASK_WITHOUT_SPRINT', field: 'status', message: 'Altere para uma sprint antes de mudar o status' }];
    throw err;
  }
  // Regra: não permitir alterar status se a sprint não foi iniciada
  if (task.sprintId) {
    const sprint = sprintsRepo.findById(task.sprintId);
    if (!sprint) {
      const err = new Error('Sprint da tarefa inexistente');
      err.status = 422;
      err.errors = [{ code: 'TASK_SPRINT_NOT_FOUND', field: 'sprintId', message: 'Sprint vinculada não existe' }];
      throw err;
    }
    if (sprint.status !== 'Started') {
      const err = new Error('Não é possível atualizar status: sprint não iniciada');
      err.status = 409;
      err.errors = [{ code: 'SPRINT_NOT_STARTED_FOR_TASK', field: 'sprint.status', message: 'Inicie a sprint para alterar status de tarefas' }];
      throw err;
    }
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

// deleteTask será declarado no escopo do módulo, fora desta função

// Definir dueDate quando entrar em 'Em Andamento' (sempre recalcula)
if (newStatus === 'Em Andamento') {
  // garantir totals atualizados
  withTotals(task);
  // Garantir que totalDays seja um número válido
  const days = Math.max(1, Math.round(Number(task.totalDays) || 1));
  const target = computeDueDateForTask(toUtcIso(), days);
  task.dueDate = endOfWorkdayUtc(target, 18, 0);
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

function deleteTask(id) {
const task = getTask(id);
if (!task) return null;
if (task.sprintId) {
const sprint = sprintsRepo.findById(task.sprintId);
if (sprint) {
sprint.taskIds = sprint.taskIds.filter(tid => tid !== task.id);
sprint.updatedAt = toUtcIso();
sprintsRepo.update(sprint);
}
}
tasksRepo.remove(id);
return { id };
}

module.exports = {
createTask,
listTasks,
getTask,
updateTask,
setAssignee,
transitionStatus,
  deleteTask,
};
