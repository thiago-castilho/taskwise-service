const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const PRODUCTIVE_HOURS_PER_DAY = 6.0;

function toUtcIso(date = new Date()) {
return dayjs(date).utc().toISOString();
}

function addBusinessDaysFromNextDay(startDateIso, days) {
// soma a partir do dia seguinte, pulando sábados e domingos
let date = dayjs(startDateIso).utc().add(1, 'day');
let added = 0;
const toAdd = Math.ceil(days);
while (added < toAdd) {
const dow = date.day(); // 0=Dom, 6=Sáb
if (dow !== 0 && dow !== 6) {
added++;
}
if (added < toAdd) {
date = date.add(1, 'day');
}
}
return date.toISOString();
}

function businessDaysBetween(startIso, endIso) {
// dias úteis inteiros entre duas datas (exclusivo do start, inclusivo do end)
let start = dayjs(startIso).utc();
let end = dayjs(endIso).utc();
if (end.isBefore(start)) return 0;
let days = 0;
let d = start.add(1, 'day');
while (d.isSameOrBefore(end, 'day')) {
const dow = d.day();
if (dow !== 0 && dow !== 6) days++;
d = d.add(1, 'day');
}
return days;
}

module.exports = {
PRODUCTIVE_HOURS_PER_DAY,
toUtcIso,
addBusinessDaysFromNextDay,
businessDaysBetween,
};
