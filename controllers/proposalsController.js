const getProposals = (req, res) => {
  const proposals = [
    {
      id: 1,
      description: 'Fund community research on governance tooling.',
      executed: false,
      creator: '0x1111111111111111111111111111111111111111'
    },
    {
      id: 2,
      description: 'Upgrade DAO contract to v2.0.',
      executed: true,
      creator: '0x2222222222222222222222222222222222222222'
    }
  ];

  res.json({
    total: proposals.length,
    proposals
  });
};

module.exports = {
  getProposals
};
