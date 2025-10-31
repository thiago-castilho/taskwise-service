const { v4: uuidv4 } = require('uuid');
const { toUtcIso } = require('../utils/time');
const bcrypt = require('bcryptjs');

const users = [];
const tasks = [];
const sprints = [];

function seed() {
if (users.length) return;
// Usuários
const adminPass = bcrypt.hashSync('admin123', 8);
const rwPass = bcrypt.hashSync('user123', 8);
users.push(
{ id: uuidv4(), name: 'Admin', email: 'admin@taskwise.local', passwordHash: adminPass, role: 'Admin', createdAt: toUtcIso() },
{ id: uuidv4(), name: 'Usuário RW', email: 'user@taskwise.local', passwordHash: rwPass, role: 'ReadWrite', createdAt: toUtcIso() },
);
// Tarefas exemplo
const t1 = {
id: uuidv4(),
title: 'Caso de teste login',
description: 'Cobrir fluxos de login',
phases: {
analiseModelagem: { O: 0.5, M: 1.0, P: 1.5 },
execucao: { O: 1.0, M: 2.0, P: 3.0 },
reteste: { O: 0.2, M: 0.5, P: 1.0 },
documentacao: { O: 0.2, M: 0.5, P: 0.8 },
},
status: 'Backlog',
assigneeId: null,
block: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
_totalsCache: null,
sprintId: null,
complexidade: 'Média',
risco: 'Médio',
};
const t2 = {
id: uuidv4(),
title: 'Fluxo de cadastro',
description: 'Cobrir cadastro happy path',
phases: {
analiseModelagem: { O: 0.3, M: 0.5, P: 0.8 },
execucao: { O: 0.8, M: 1.5, P: 2.5 },
reteste: { O: 0.2, M: 0.5, P: 0.8 },
documentacao: { O: 0.2, M: 0.4, P: 0.6 },
},
status: 'Backlog',
assigneeId: null,
block: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
_totalsCache: null,
sprintId: null,
complexidade: 'Baixa',
risco: 'Baixo',
};
tasks.push(t1, t2);

// Mais tarefas de exemplo (todas sem sprint)
for (let i = 1; i <= 10; i++) {
const ti = {
id: uuidv4(),
title: `Tarefa exemplo ${i}`,
description: `Tarefa de exemplo número ${i}`,
phases: {
analiseModelagem: { O: 0.3 + (i % 3) * 0.1, M: 0.6 + (i % 3) * 0.2, P: 1.0 + (i % 3) * 0.3 },
execucao: { O: 0.8 + (i % 4) * 0.2, M: 1.5 + (i % 4) * 0.3, P: 2.5 + (i % 4) * 0.4 },
reteste: { O: 0.2, M: 0.5 + (i % 2) * 0.2, P: 0.9 + (i % 2) * 0.2 },
documentacao: { O: 0.2, M: 0.4 + (i % 2) * 0.1, P: 0.7 + (i % 2) * 0.1 },
},
status: 'Backlog',
assigneeId: null,
block: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
_totalsCache: null,
sprintId: null,
complexidade: ['Baixa', 'Média', 'Alta'][i % 3],
risco: ['Baixo', 'Médio', 'Alto'][i % 3],
};
tasks.push(ti);
}

// Sprint exemplo (não iniciada)
sprints.push({
id: uuidv4(),
name: 'Sprint 1',
taskIds: [t1.id],
status: 'Created',
capacity: { junior: 1, pleno: 1, senior: 0 },
startedAt: null,
closedAt: null,
createdAt: toUtcIso(),
updatedAt: toUtcIso(),
});
}

module.exports = { users, tasks, sprints, seed };
