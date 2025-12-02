const { getAllProposals } = require('../store/proposalsStore');

const getProposals = (req, res) => {
  const proposals = getAllProposals();

  res.json({
    total: proposals.length,
    proposals
  });
};

module.exports = {
  getProposals
};
