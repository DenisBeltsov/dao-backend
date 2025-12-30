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

const toBigInt = (value, fallback = 0n) => {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return BigInt(Math.trunc(value))
    }
    return fallback
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return fallback
    }
    try {
      return trimmed.startsWith('0x') ? BigInt(trimmed) : BigInt(trimmed)
    } catch (error) {
      console.warn('Failed to parse bigint', value, error)
      return fallback
    }
  }
  return fallback
}

const normalizeTimestamp = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return Date.now()
}

const upsertProposal = (proposal) => {
  const normalizedId = normalizeId(proposal.id);
  const index = findProposalIndex(normalizedId);

  if (index === -1) {
    inMemoryProposals.push({
      id: normalizedId,
      description: proposal.description || '',
      executed: Boolean(proposal.executed),
      creator: proposal.creator || null,
      votesFor: toBigInt(proposal.votesFor || 0n).toString(),
      votesAgainst: toBigInt(proposal.votesAgainst || 0n).toString(),
      lastSupport: proposal.lastSupport ?? null,
      lastVoter: proposal.lastVoter ?? null,
      executor: proposal.executor || null,
      finalized: Boolean(proposal.finalized),
      finalizer: proposal.finalizer || null,
      createdAt: proposal.createdAt ? normalizeTimestamp(proposal.createdAt) : proposal.createdAt,
    })
    return
  }

  const existing = inMemoryProposals[index]
  inMemoryProposals[index] = {
    ...existing,
    ...proposal,
    id: normalizedId,
    votesFor: toBigInt(proposal.votesFor ?? existing.votesFor ?? 0n).toString(),
    votesAgainst: toBigInt(proposal.votesAgainst ?? existing.votesAgainst ?? 0n).toString(),
    finalized: proposal.finalized !== undefined ? Boolean(proposal.finalized) : existing.finalized,
    finalizer: proposal.finalizer !== undefined ? proposal.finalizer : existing.finalizer ?? null,
    createdAt: existing.createdAt ?? (proposal.createdAt ? normalizeTimestamp(proposal.createdAt) : Date.now()),
  }
};

const recordVote = ({ id, support, voter, votesFor, votesAgainst, createdAt }) => {
  const normalizedId = normalizeId(id);
  const index = findProposalIndex(normalizedId);

  const updateData = {
    votesFor: toBigInt(votesFor ?? 0n).toString(),
    votesAgainst: toBigInt(votesAgainst ?? 0n).toString(),
    lastSupport: support,
    lastVoter: voter,
  };

  if (index === -1) {
    inMemoryProposals.push({
      id: normalizedId,
      description: '',
      executed: false,
      creator: null,
      executor: null,
      createdAt: createdAt ? normalizeTimestamp(createdAt) : Date.now(),
      ...updateData,
    })
    return;
  }

  inMemoryProposals[index] = {
    ...inMemoryProposals[index],
    ...updateData,
  }
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

const markProposalFinalized = ({ id, finalizer }) => {
  const normalizedId = normalizeId(id);
  const index = findProposalIndex(normalizedId);
  if (index === -1) {
    upsertProposal({
      id: normalizedId,
      finalized: true,
      finalizer
    });
    return;
  }

  inMemoryProposals[index] = {
    ...inMemoryProposals[index],
    finalized: true,
    finalizer
  };
};

const getAllProposals = () => [...inMemoryProposals];

const getProposalById = (id) => {
  const normalizedId = normalizeId(id);
  return inMemoryProposals.find((proposal) => proposal.id === normalizedId) || null;
};

module.exports = {
  inMemoryProposals,
  upsertProposal,
  recordVote,
  markProposalExecuted,
  markProposalFinalized,
  getAllProposals,
  getProposalById,
};
