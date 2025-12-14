const { ethers } = require('ethers');
const daoContractDefinition = require('../daoABI.json');
const {
  upsertProposal,
  recordVote,
  markProposalExecuted
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
    console.log('[events] Started pollEvents.');

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

      const [createdEvents, voteEvents, executedEvents] = await Promise.all([
        contract.queryFilter(proposalCreatedFilter, fromBlock, toBlock),
        votedFilter ? contract.queryFilter(votedFilter, fromBlock, toBlock) : Promise.resolve([]),
        contract.queryFilter(executedFilter, fromBlock, toBlock)
      ]);

      createdEvents.forEach((event) => {
        const { id, creator, description } = event.args;
        upsertProposal({
          id: Number(id),
          description,
          executed: false,
          creator
        });

        console.log('[events] ProposalCreated', {
          id: Number(id),
          description,
          creator,
          blockNumber: event.blockNumber
        });
      });

      voteEvents.forEach((event) => {
        const { id, support, voter, weight } = event.args;
        recordVote({
          id: Number(id),
          support: Boolean(support),
          voter,
          weight: weight ? weight.toString() : undefined
        });

        console.log('[events] Voted', {
          id: Number(id),
          support: Boolean(support),
          voter,
          weight: weight ? weight.toString() : undefined,
          blockNumber: event.blockNumber
        });
      });

      executedEvents.forEach((event) => {
        const { id, executor } = event.args;
        markProposalExecuted({
          id: Number(id),
          executor
        });

        console.log('[events] ProposalExecuted', {
          id: Number(id),
          executor,
          blockNumber: event.blockNumber
        });
      });

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
