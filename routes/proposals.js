const express = require('express');
const { getProposals } = require('../controllers/proposalsController');

const router = express.Router();

router.get('/', getProposals);

module.exports = router;
