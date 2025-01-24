const express = require('express');
const { convert } = require('../controllers/converter.controller');
const router = express.Router();

router.post('/', convert);

module.exports = router;
