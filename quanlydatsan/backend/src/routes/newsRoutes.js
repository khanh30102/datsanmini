const express = require('express');
const { getFootballNews } = require('../controllers/newsController');

const router = express.Router();
router.get('/', getFootballNews);

module.exports = router;
