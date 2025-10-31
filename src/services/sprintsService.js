const { v4: uuidv4 } = require('uuid');
const { toUtcIso, addBusinessDaysFromNextDay, businessDaysBetween, endOfWorkdayUtc } = require('../utils/time');
const { round1, computeTaskTotals } = require('../utils/pert');
const sRepo = require('../repositories/sprintsRepository');
const tRepo = require('../repositories/tasksRepository');

const CAPACITY_BY_LEVEL = { junior: 4.8, pleno: 6.0, senior: 7.2 };

function capacityPerDay(capacity) {
const juniors = Number(capacity?.junior || 0);
const plenos = Number(capacity?.pleno || 0);
const seniors = Number(capacity?.senior || 0);
return juniors * CAPACITY_BY_LEVEL.junior + plenos * CAPACITY_BY_LEVEL.pleno + seniors * CAPACITY_BY_LEVEL.senior;
}

function computeSprintTotals(sprint) {
// Busca tarefas e valida que realmente pertencem à sprint
const tasks = sprint.taskIds
  .map(id => tRepo.findById(id))
  .filter(t => t && t.sprintId === sprint.id); // Garante que sprintId corresponde
// Garante horas corretas mesmo se a task não tiver cache prévio
const hours = tasks.reduce((acc, t) => {
  const totals = t?._totalsCache || computeTaskTotals(t.phases);
  return acc + Number(totals.totalHours || 0);
}, 0);
const cap = capacityPerDay(sprint.capacity);
const days = cap > 0 ? round1(hours / cap) : 0;
return { hours, days, cap };
}

function createSprint({ name, taskIds = [], capacity }) {
  // Exclusividade: nenhuma tarefa pode já estar vinculada a outra sprint (quando fornecidas)
  const tasks = (Array.isArray(taskIds) ? taskIds : []).map(id => tRepo.findById(id)).filter(Boolean);
  const taskAlreadyLinked = tasks.find(t => t && t.sprintId);
  if (taskAlreadyLinked) {
    const err = new Error('Tarefa já vinculada a outra sprint');
    err.status = 409;
    err.errors = [{ code: 'TASK_ALREADY_IN_SPRINT', field: 'taskIds', message: `Tarefa ${taskAlreadyLinked.id} já possui sprintId` }];
    throw err;
  }
const sprint = {
id: uuidv4(),
name,
    taskIds: (Array.isArray(taskIds) ? taskIds : []).slice(),
status: 'Created',
capacity: {
  junior: capacity ? Number(capacity.junior || 0) : 0,
  pleno: capacity ? Number(capacity.pleno || 0) : 0,
  senior: capacity ? Number(capacity.senior || 0) : 0,
},
startedAt: null,
closedAt: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
};
sRepo.add(sprint);
  // Sincroniza sprintId nas tarefas incluídas (se houver)
  tasks.forEach(t => { if (t) { t.sprintId = sprint.id; t.updatedAt = toUtcIso(); } });
return sprint;
}

function setCapacity(id, capacity) {
const sprint = sRepo.findById(id);
if (!sprint) return null;
sprint.capacity = {
junior: Number(capacity.junior || 0),
pleno: Number(capacity.pleno || 0),
senior: Number(capacity.senior || 0),
};
sprint.updatedAt = toUtcIso();
// Se a sprint está iniciada, recalcula dueDate da sprint e das tarefas "Em Andamento"
if (sprint.status === 'Started') {
  // Recalcula dueDate da sprint baseado na nova capacidade
  const totals = computeSprintTotals(sprint);
  if (sprint.startedAt) {
    const targetDate = addBusinessDaysFromNextDay(sprint.startedAt, totals.days);
    sprint.dueDate = endOfWorkdayUtc(targetDate, 18, 0);
  }
  // Recalcula dueDate das tarefas "Em Andamento"
  const tasks = sprint.taskIds.map(tid => tRepo.findById(tid)).filter(Boolean);
  tasks.forEach(task => {
    if (task.status === 'Em Andamento' && task.dueDate) {
      // Recalcula dueDate baseado na estimativa atual da tarefa
      const days = Math.max(1, Math.round(Number(task.totalDays) || 0));
      const target = addBusinessDaysFromNextDay(toUtcIso(), days);
      task.dueDate = endOfWorkdayUtc(target, 18, 0);
      task.updatedAt = toUtcIso();
      tRepo.update(task);
    }
  });
}
sRepo.update(sprint);
return sprint;
}

function startSprint(id) {
const sprint = sRepo.findById(id);
if (!sprint) return null;
if (sprint.status !== 'Created') {
const err = new Error('Sprint já iniciada ou encerrada');
err.status = 409;
err.errors = [{ code: 'SPRINT_ALREADY_STARTED', field: 'status', message: 'Não é possível iniciar' }];
throw err;
}
  if (!Array.isArray(sprint.taskIds) || sprint.taskIds.length < 1) {
    const err = new Error('Sprint sem tarefas não pode ser iniciada');
    err.status = 422;
    err.errors = [{ code: 'SPRINT_TASKS_REQUIRED_TO_START', field: 'taskIds', message: 'Adicione ao menos 1 tarefa' }];
    throw err;
  }
sprint.status = 'Started';
sprint.startedAt = toUtcIso();
const totals = computeSprintTotals(sprint);
const targetDate = addBusinessDaysFromNextDay(sprint.startedAt, totals.days);
sprint.dueDate = endOfWorkdayUtc(targetDate, 18, 0);
sprint.updatedAt = toUtcIso();
sRepo.update(sprint);
return sprint;
}

function closeSprint(id) {
const sprint = sRepo.findById(id);
if (!sprint) return null;
if (sprint.status !== 'Started') {
const err = new Error('Sprint não está iniciada');
err.status = 409;
err.errors = [{ code: 'SPRINT_NOT_STARTED', field: 'status', message: 'Não é possível encerrar' }];
throw err;
}
  // Regra: não encerrar se houver tarefas não concluídas
  const tasks = sprint.taskIds.map(tid => tRepo.findById(tid)).filter(Boolean);
  const unfinished = tasks.filter(t => t.status !== 'Concluída');
  if (unfinished.length > 0) {
    const err = new Error('Sprint possui tarefas não concluídas');
    err.status = 409;
    err.errors = [{ code: 'SPRINT_HAS_UNFINISHED_TASKS', field: 'taskIds', message: `Existem ${unfinished.length} tarefas não concluídas` }];
    throw err;
  }
sprint.status = 'Closed';
sprint.closedAt = toUtcIso();
sprint.updatedAt = toUtcIso();
sRepo.update(sprint);
return sprint;
}

function getSprint(id) { return sRepo.findById(id); }
function listSprints() { return sRepo.listAll(); }

function summaryDashboard(sprintId) {
const sprint = sRepo.findById(sprintId);
if (!sprint) return null;
const totals = computeSprintTotals(sprint);
// Busca tarefas e valida que realmente pertencem à sprint
const tasks = sprint.taskIds
  .map(id => tRepo.findById(id))
  .filter(t => t && t.sprintId === sprintId); // Garante que sprintId corresponde
const hoursDone = tasks.filter(t => t.status === 'Concluída')
.reduce((a, t) => a + Number(t.totalHours || t._totalsCache?.totalHours || 0), 0);
const progressoReal = totals.hours > 0 ? (hoursDone / totals.hours) * 100 : 0;
let progressoEsperado = 0;
if (sprint.status === 'Started' && sprint.startedAt) {
const daysPassed = businessDaysBetween(sprint.startedAt, toUtcIso());
const plannedDays = Math.ceil(totals.days || 0);
progressoEsperado = plannedDays > 0 ? (daysPassed / plannedDays) * 100 : 0;
}
const blocked = tasks.filter(t => t.status === 'Bloqueada');
	let statusSemaforo = 'Verde';
	if (sprint.status !== 'Started') {
		statusSemaforo = 'Verde';
	}
	else if (progressoReal < progressoEsperado) statusSemaforo = 'Vermelho';
	else if (progressoReal >= progressoEsperado && blocked.length > 0) statusSemaforo = 'Amarelo';

// Contagem de tarefas por status - apenas tarefas válidas que realmente pertencem à sprint
const countsByStatus = VALID_STATUSES.reduce((acc, s) => {
  acc[s] = tasks.filter(t => t && t.status === s && t.sprintId === sprintId).length;
  return acc;
}, {});

const blockedList = blocked.map(b => ({
id: b.id,
title: b.title,
motivo: b.block?.motivo,
responsavelId: b.block?.responsavelId,
idade_do_bloqueio_dias: b.block?.blockedAt ? businessDaysBetween(b.block.blockedAt, toUtcIso()) : 0,
}));

  // Tarefas sem sprint
  const allTasks = require('../repositories/tasksRepository').listAll();
  const noSprintTasks = allTasks.filter(t => !t.sprintId);
  const tarefasSemSprint = {
    total: noSprintTasks.length,
    items: noSprintTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      idade_dias: businessDaysBetween(t.createdAt, toUtcIso()),
    })),
  };

  return {
		sprint_status: sprint.status,
		sprint_iniciada: sprint.status === 'Started',
dias_sprint: totals.days,
progresso_real_percent: Math.round(progressoReal * 10) / 10,
progresso_esperado_percent: Math.round(progressoEsperado * 10) / 10,
status_semaforo: statusSemaforo,
tarefas_por_status: countsByStatus,
    bloqueadas: blockedList,
    tarefas_sem_sprint: tarefasSemSprint,
};
}

// Adicionar tarefas a uma sprint ainda não iniciada (status Created)
function addTasksToSprint(id, taskIdsToAdd = []) {
  const sprint = sRepo.findById(id);
  if (!sprint) return null;
  if (sprint.status !== 'Created') {
    const err = new Error('Sprint já iniciada ou encerrada');
    err.status = 409;
    err.errors = [{ code: 'SPRINT_NOT_EDITABLE', field: 'status', message: 'Não é possível adicionar tarefas' }];
    throw err;
  }
  if (!Array.isArray(taskIdsToAdd) || taskIdsToAdd.length < 1) {
    const err = new Error('Informe tarefas para adicionar');
    err.status = 422;
    err.errors = [{ code: 'TASK_IDS_REQUIRED', field: 'taskIds', message: 'Envie ao menos 1 tarefa' }];
    throw err;
  }
  const tasks = taskIdsToAdd.map(id => tRepo.findById(id)).filter(Boolean);
  const alreadyLinked = tasks.find(t => t && t.sprintId && t.sprintId !== sprint.id);
  if (alreadyLinked) {
    const err = new Error('Tarefa já vinculada a outra sprint');
    err.status = 409;
    err.errors = [{ code: 'TASK_ALREADY_IN_SPRINT', field: 'taskIds', message: `Tarefa ${alreadyLinked.id} já possui sprintId` }];
    throw err;
  }
  // Adiciona apenas IDs ainda não presentes e sincroniza sprintId nas tarefas
  tasks.forEach(t => {
    if (!sprint.taskIds.includes(t.id)) sprint.taskIds.push(t.id);
    if (!t.sprintId) { t.sprintId = sprint.id; t.updatedAt = toUtcIso(); }
  });
  sprint.updatedAt = toUtcIso();
  sRepo.update(sprint);
  return sprint;
}

// Remover tarefas de uma sprint ainda não iniciada (status Created)
function removeTasksFromSprint(id, taskIdsToRemove = []) {
  const sprint = sRepo.findById(id);
  if (!sprint) return null;
  if (sprint.status !== 'Created') {
    const err = new Error('Sprint já iniciada ou encerrada');
    err.status = 409;
    err.errors = [{ code: 'SPRINT_NOT_EDITABLE', field: 'status', message: 'Não é possível remover tarefas' }];
    throw err;
  }
  if (!Array.isArray(taskIdsToRemove) || taskIdsToRemove.length < 1) {
    const err = new Error('Informe tarefas para remover');
    err.status = 422;
    err.errors = [{ code: 'TASK_IDS_REQUIRED', field: 'taskIds', message: 'Envie ao menos 1 tarefa' }];
    throw err;
  }
  // Validar que todas pertencem à sprint
  const invalid = taskIdsToRemove.filter(id => !sprint.taskIds.includes(id));
  if (invalid.length) {
    const err = new Error('Tarefas não pertencem à sprint');
    err.status = 422;
    err.errors = [{ code: 'TASKS_NOT_IN_SPRINT', field: 'taskIds', message: `IDs não pertencentes: ${invalid.join(',')}` }];
    throw err;
  }
  // Remover da sprint e limpar sprintId nas tasks
  sprint.taskIds = sprint.taskIds.filter(id => !taskIdsToRemove.includes(id));
  taskIdsToRemove.forEach(tid => {
    const task = tRepo.findById(tid);
    if (task && task.sprintId === sprint.id) {
      task.sprintId = null;
      task.updatedAt = toUtcIso();
    }
  });
  sprint.updatedAt = toUtcIso();
  sRepo.update(sprint);
  return sprint;
}

const VALID_STATUSES = ['Backlog', 'Em Andamento', 'Bloqueada', 'Concluída'];

module.exports = {
createSprint,
setCapacity,
startSprint,
closeSprint,
getSprint,
listSprints,
summaryDashboard,
  addTasksToSprint,
  removeTasksFromSprint,
computeSprintTotals,
};
