const { formatForTimezone } = require('../utils/time');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const KNOWN_DATE_FIELDS = new Set([
  'createdAt', 'updatedAt', 'dueDate',
  'startedAt', 'closedAt',
  'blockedAt', 'resolvedAt',
]);

function transformDates(obj, tz) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(item => transformDates(item, tz));
  if (typeof obj === 'object') {
    const out = Array.isArray(obj) ? [] : { ...obj };
    for (const key of Object.keys(out)) {
      const val = out[key];
      if (val && KNOWN_DATE_FIELDS.has(key) && typeof val === 'string') {
        // dueDate sempre mostra como 18:00 no timezone local
        if (key === 'dueDate') {
          const dateOnly = dayjs(val).tz(tz).startOf('day').hour(18).minute(0);
          out[key] = dateOnly.format('DD-MM-YYYY HH:mm');
        } else {
          out[key] = formatForTimezone(val, tz);
        }
      } else if (val && typeof val === 'object') {
        out[key] = transformDates(val, tz);
      }
    }
    return out;
  }
  return obj;
}

function timeFormatMiddleware(req, res, next) {
  let tz = req.headers['x-timezone'] || req.query.tz || null;
  if (!tz) {
    const al = (req.headers['accept-language'] || '').toLowerCase();
    // Heurística simples baseada na localidade principal
    if (al.includes('pt-br')) tz = 'America/Sao_Paulo';
    else if (al.includes('en-us')) tz = 'America/New_York';
    else if (al.includes('en-gb')) tz = 'Europe/London';
    else if (al.includes('es-es')) tz = 'Europe/Madrid';
    else if (al.includes('es-mx')) tz = 'America/Mexico_City';
    else if (al.includes('fr-fr')) tz = 'Europe/Paris';
    else tz = 'UTC';
  }
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      const transformed = transformDates(body, tz);
      return originalJson(transformed);
    } catch (e) {
      // fallback sem transformação
      return originalJson(body);
    }
  };
  next();
}

module.exports = { timeFormatMiddleware };


