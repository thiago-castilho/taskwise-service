const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const spec = YAML.load(path.join(process.cwd(), 'resources', 'swagger.yaml'));

router.use('/', swaggerUi.serve, swaggerUi.setup(spec));

module.exports = router;
