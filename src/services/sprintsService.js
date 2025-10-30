const { v4: uuidv4 } = require('uuid');
const { toUtcIso, addBusinessDaysFromNextDay, businessDaysBetween } = require('../utils/time');
const { round1 } = require('../utils/pert');
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
const tasks = sprint.taskIds.map(id => tRepo.findById(id)).filter(Boolean);
const hours = tasks.reduce((acc, t) => acc + Number(t.totalHours || t._totalsCache?.totalHours || 0), 0);
const cap = capacityPerDay(sprint.capacity);
const days = cap > 0 ? round1(hours / cap) : 0;
return { hours, days, cap };
}

function createSprint({ name, taskIds, capacity }) {
if (!Array.isArray(taskIds) || taskIds.length < 1) {
const err = new Error('Sprint sem tarefas');
err.status = 422;
err.errors = [{ code: 'SPRINT_TASKS_REQUIRED', field: 'taskIds', message: 'Informe ao menos 1 tarefa' }];
throw err;
}
const sprint = {
id: uuidv4(),
name,
taskIds: taskIds.slice(),
status: 'Created',
capacity: capacity || { junior: 0, pleno: 0, senior: 0 },
startedAt: null,
closedAt: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
};
sRepo.add(sprint);
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
sprint.status = 'Started';
sprint.startedAt = toUtcIso();
const totals = computeSprintTotals(sprint);
sprint.dueDate = addBusinessDaysFromNextDay(sprint.startedAt, totals.days);
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
const tasks = sprint.taskIds.map(id => tRepo.findById(id)).filter(Boolean);
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

const countsByStatus = VALID_STATUSES.reduce((acc, s) => {
acc[s] = tasks.filter(t => t.status === s).length; return acc;
}, {});

const blockedList = blocked.map(b => ({
id: b.id,
title: b.title,
motivo: b.block?.motivo,
responsavelId: b.block?.responsavelId,
idade_do_bloqueio_dias: b.block?.blockedAt ? businessDaysBetween(b.block.blockedAt, toUtcIso()) : 0,
}));

	return {
		sprint_status: sprint.status,
		sprint_iniciada: sprint.status === 'Started',
dias_sprint: totals.days,
progresso_real_percent: Math.round(progressoReal * 10) / 10,
progresso_esperado_percent: Math.round(progressoEsperado * 10) / 10,
status_semaforo: statusSemaforo,
tarefas_por_status: countsByStatus,
bloqueadas: blockedList,
};
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
computeSprintTotals,
};
