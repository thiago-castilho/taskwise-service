const { sprints } = require('./db');

function listAll() { return sprints.slice(); }
function findById(id) { return sprints.find(s => s.id === id); }
function add(sprint) { sprints.push(sprint); return sprint; }
function update(sprint) {
const idx = sprints.findIndex(s => s.id === sprint.id);
if (idx >= 0) sprints[idx] = sprint;
return sprint;
}

module.exports = { listAll, findById, add, update };
