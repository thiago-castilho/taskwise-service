const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const PRODUCTIVE_HOURS_PER_DAY = 6.0;

function toUtcIso(date = new Date()) {
return dayjs(date).utc().toISOString();
}

function formatForTimezone(dateIso, tz = 'UTC', format = 'DD-MM-YYYY HH:mm') {
if (!dateIso) return null;
try { return dayjs(dateIso).tz(tz).format(format); } catch (e) { return dayjs(dateIso).utc().format(format); }
}

function addBusinessDaysFromNextDay(startDateIso, days) {
// soma a partir do dia seguinte, pulando sábados e domingos
// days já deve ser inteiro (arredondado)
const toAdd = Math.max(1, Math.round(Number(days) || 0));
// Começa no próximo dia após a data inicial (no início do dia)
let date = dayjs(startDateIso).utc().startOf('day').add(1, 'day');
// Pula para o próximo dia útil se começar em fim de semana
while (date.day() === 0 || date.day() === 6) {
date = date.add(1, 'day');
}
// Agora conta exatamente 'toAdd' dias úteis
let added = 0;
// Loop até ter contado todos os dias úteis necessários
while (added < toAdd) {
// Verifica se o dia atual é útil (não é domingo=0 nem sábado=6)
if (date.day() !== 0 && date.day() !== 6) {
added++;
}
// Se já contou todos os dias necessários, para
if (added >= toAdd) break;
// Avança para o próximo dia
date = date.add(1, 'day');
}
return date.toISOString();
}

function endOfWorkdayUtc(dateIso, hour = 18, minute = 0) {
// Pega a data no início do dia (00:00) e seta o horário de fim de expediente
const d = dayjs(dateIso).utc().startOf('day').hour(hour).minute(minute).second(0).millisecond(0);
return d.toISOString();
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
formatForTimezone,
endOfWorkdayUtc,
};
