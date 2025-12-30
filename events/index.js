const { ethers } = require('ethers');
const daoContractDefinition = require('../daoABI.json');
const {
  upsertProposal,
  recordVote,
  markProposalExecuted,
  markProposalFinalized
} = require('../store/proposalsStore');

let initialized = false;
let pollTimer = null;
let lastProcessedBlock = null;
let isPolling = false;

const parseNumberEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const initEventListeners = () => {
  if (initialized) {
    return;
  }

  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.DAO_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    console.warn(
      '[events] Missing RPC_URL or DAO_CONTRACT_ADDRESS environment variables. Skipping contract polling.'
    );
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, daoContractDefinition.abi, provider);

  const startBlockEnv = process.env.START_BLOCK;
  lastProcessedBlock = startBlockEnv ? parseNumberEnv(startBlockEnv, 0) : null;
  const pollIntervalMs = parseNumberEnv(process.env.POLL_INTERVAL_MS, 10000);

  const pollEvents = async () => {

    if (isPolling) {
      return;
    }

    isPolling = true;

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(
        lastProcessedBlock === null ? currentBlock : lastProcessedBlock,
        0
      );

      if (fromBlock > currentBlock) {
        lastProcessedBlock = currentBlock;
        return;
      }

      const toBlock = currentBlock;

      const proposalCreatedFilter = contract.filters.ProposalCreated();
      const votedFilter = contract.filters.Voted ? contract.filters.Voted() : null;
      const executedFilter = contract.filters.ProposalExecuted();
      const finalizedFilter = contract.filters.ProposalFinalized
        ? contract.filters.ProposalFinalized()
        : null;

      const [createdEvents, voteEvents, executedEvents, finalizedEvents] = await Promise.all([
        contract.queryFilter(proposalCreatedFilter, fromBlock, toBlock),
        votedFilter ? contract.queryFilter(votedFilter, fromBlock, toBlock) : Promise.resolve([]),
        contract.queryFilter(executedFilter, fromBlock, toBlock),
        finalizedFilter ? contract.queryFilter(finalizedFilter, fromBlock, toBlock) : Promise.resolve([])
      ]);

      for (const event of createdEvents) {
        const { id, creator } = event.args
        const snapshot = await contract.getProposal(id)
        upsertProposal({
          id: Number(snapshot[0]),
          description: snapshot[1],
          executed: Boolean(snapshot[2]),
          votesFor: snapshot[4].toString(),
          votesAgainst: snapshot[5].toString(),
          createdAt: Number(snapshot[6]) * 1000,
          creator,
        })

        console.log('[events] ProposalCreated', {
          id: Number(id),
          description: snapshot[1],
          creator,
          blockNumber: event.blockNumber,
        })
      }

      for (const event of voteEvents) {
        const { id, support, voter } = event.args
        const snapshot = await contract.getProposal(id)
        recordVote({
          id: Number(snapshot[0]),
          support: Boolean(support),
          voter,
          votesFor: snapshot[4].toString(),
          votesAgainst: snapshot[5].toString(),
          createdAt: Number(snapshot[6]) * 1000,
        })
        upsertProposal({
          id: Number(snapshot[0]),
          description: snapshot[1],
          executed: Boolean(snapshot[2]),
          votesFor: snapshot[4].toString(),
          votesAgainst: snapshot[5].toString(),
          createdAt: Number(snapshot[6]) * 1000,
        })

        console.log('[events] Voted', {
          id: Number(id),
          support: Boolean(support),
          voter,
          blockNumber: event.blockNumber,
        })
      }

      for (const event of executedEvents) {
        const { id, executor } = event.args
        const snapshot = await contract.getProposal(id)
        markProposalExecuted({
          id: Number(snapshot[0]),
          executor,
        })
        upsertProposal({
          id: Number(snapshot[0]),
          description: snapshot[1],
          executed: Boolean(snapshot[2]),
          votesFor: snapshot[4].toString(),
          votesAgainst: snapshot[5].toString(),
          createdAt: Number(snapshot[6]) * 1000,
        })

        console.log('[events] ProposalExecuted', {
          id: Number(id),
          executor,
          blockNumber: event.blockNumber,
        })
      }

      for (const event of finalizedEvents) {
        const { id, finalizer } = event.args
        const snapshot = await contract.getProposal(id)
        markProposalFinalized({
          id: Number(snapshot[0]),
          finalizer,
        })
        upsertProposal({
          id: Number(snapshot[0]),
          description: snapshot[1],
          executed: Boolean(snapshot[2]),
          finalized: Boolean(snapshot[3]),
          votesFor: snapshot[4].toString(),
          votesAgainst: snapshot[5].toString(),
          createdAt: Number(snapshot[6]) * 1000,
        })

        console.log('[events] ProposalFinalized', {
          id: Number(id),
          finalizer,
          blockNumber: event.blockNumber,
        })
      }

      lastProcessedBlock = toBlock + 1;
    } catch (error) {
      console.error('[events] Polling error', error);
    } finally {
      isPolling = false;
    }
  };

  pollEvents();
  pollTimer = setInterval(pollEvents, pollIntervalMs);

  initialized = true;
  console.log('[events] Contract polling initialized');
};

module.exports = {
  initEventListeners
};
