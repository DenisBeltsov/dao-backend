const express = require('express');
const { getProposals, getProposal } = require('../controllers/proposalsController');

const router = express.Router();

router.get('/', getProposals);
router.get('/:id', getProposal);
module.exports = router;
