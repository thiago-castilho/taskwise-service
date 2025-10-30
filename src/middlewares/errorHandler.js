function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
const status = err.status || 500;
const errors = err.errors || [{ code: 'INTERNAL_ERROR', field: null, message: err.message || 'Erro interno' }];
res.status(status).json(errors);
}

module.exports = { errorHandler };
