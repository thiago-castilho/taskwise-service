const { tasks } = require('./db');

function listAll() { return tasks.slice(); }
function findById(id) { return tasks.find(t => t.id === id); }
function add(task) { tasks.push(task); return task; }
function update(task) {
const idx = tasks.findIndex(t => t.id === task.id);
if (idx >= 0) tasks[idx] = task;
return task;
}

module.exports = { listAll, findById, add, update };
