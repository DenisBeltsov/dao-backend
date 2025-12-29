const express = require('express');
const { getProposals, getProposal, getProposalResults } = require('../controllers/proposalsController');

const router = express.Router();

router.get('/', getProposals);
router.get('/:id', getProposal);
router.get('/results/:id', getProposalResults);

module.exports = router;
