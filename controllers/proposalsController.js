const {
  getAllProposals,
  getProposalById
} = require('../store/proposalsStore');

const getProposals = (req, res) => {
  const proposals = getAllProposals();

  res.json({
    total: proposals.length,
    proposals
  });
};

const getProposal = (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return res.status(400).json({ message: 'Invalid proposal id' });
  }

  const proposal = getProposalById(numericId);
  if (!proposal) {
    return res.status(404).json({ message: 'Proposal not found' });
  }

  res.json(proposal);
};


module.exports = {
  getProposals,
  getProposal
};
