const inMemoryProposals = [];

const normalizeId = (idLike) => {
  try {
    return typeof idLike === 'bigint' ? Number(idLike) : Number(idLike);
  } catch (error) {
    console.warn('Failed to normalize proposal id', error);
    return Number(idLike);
  }
};

const findProposalIndex = (id) => {
  return inMemoryProposals.findIndex((proposal) => proposal.id === id);
};

const upsertProposal = (proposal) => {
  const normalizedId = normalizeId(proposal.id);
  const index = findProposalIndex(normalizedId);

  if (index === -1) {
    inMemoryProposals.push({
      id: normalizedId,
      description: proposal.description || '',
      executed: Boolean(proposal.executed),
      creator: proposal.creator || null,
      votesFor: proposal.votesFor || 0,
      votesAgainst: proposal.votesAgainst || 0,
      lastSupport: proposal.lastSupport ?? null,
      lastVoter: proposal.lastVoter ?? null,
      executor: proposal.executor || null
    });
    return;
  }

  inMemoryProposals[index] = {
    ...inMemoryProposals[index],
    ...proposal,
    id: normalizedId
  };
};

const recordVote = ({ id, support, voter, weight }) => {
  const normalizedId = normalizeId(id);
  const index = findProposalIndex(normalizedId);
  if (index === -1) {
    upsertProposal({
      id: normalizedId,
      votesFor: support ? (weight ?? 1) : 0,
      votesAgainst: support ? 0 : (weight ?? 1),
      lastSupport: support,
      lastVoter: voter
    });
    return;
  }

  const proposal = inMemoryProposals[index];
  const computedWeight = weight ?? 1;
  inMemoryProposals[index] = {
    ...proposal,
    votesFor: support ? (proposal.votesFor || 0) + computedWeight : proposal.votesFor || 0,
    votesAgainst: support ? proposal.votesAgainst || 0 : (proposal.votesAgainst || 0) + computedWeight,
    lastSupport: support,
    lastVoter: voter
  };
};

const markProposalExecuted = ({ id, executor }) => {
  const normalizedId = normalizeId(id);
  const index = findProposalIndex(normalizedId);
  if (index === -1) {
    upsertProposal({
      id: normalizedId,
      executed: true,
      executor
    });
    return;
  }

  inMemoryProposals[index] = {
    ...inMemoryProposals[index],
    executed: true,
    executor
  };
};

const getAllProposals = () => [...inMemoryProposals];

module.exports = {
  inMemoryProposals,
  upsertProposal,
  recordVote,
  markProposalExecuted,
  getAllProposals
};
