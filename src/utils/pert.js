const { PRODUCTIVE_HOURS_PER_DAY } = require('./time');

function validatePhasePert(phase, { O, M, P }) {
const missing = (v) => v === undefined || v === null || Number.isNaN(Number(v));
if (missing(O) || missing(M) || missing(P)) {
const err = new Error(`Fase ${phase}: O, M e P são obrigatórios`);
err.status = 422;
err.errors = [{ code: 'PERT_MISSING', field: phase, message: err.message }];
throw err;
}
const o = Number(O), m = Number(M), p = Number(P);
if (!(o <= m && m <= p)) {
const err = new Error(`Fase ${phase}: O ≤ M ≤ P inválido`);
err.status = 422;
err.errors = [{ code: 'PERT_ORDER', field: phase, message: err.message }];
throw err;
}
return { o, m, p };
}

function pert(o, m, p) {
return (o + 4 * m + p) / 6;
}

function round1(x) {
return Math.round(x * 10) / 10;
}

function computeTaskTotals(phases) {
const names = ['analiseModelagem', 'execucao', 'reteste', 'documentacao'];
let totalHours = 0;
names.forEach((name) => {
const { o, m, p } = validatePhasePert(name, phases[name] || {});
const phaseHours = pert(o, m, p);
totalHours += phaseHours;
});
const totalHoursRounded = round1(totalHours);
// Dias úteis devem ser inteiros (arredonda para o inteiro mais próximo)
const totalDaysRounded = Math.round(totalHoursRounded / PRODUCTIVE_HOURS_PER_DAY);
return { totalHours: totalHoursRounded, totalDays: totalDaysRounded };
}

module.exports = {
validatePhasePert,
computeTaskTotals,
round1,
};
