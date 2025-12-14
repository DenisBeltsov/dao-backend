const { randomBytes } = require('crypto');
const { ethers } = require('ethers');

const DEFAULT_NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const sessions = new Map();

const normalizeAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    return null;
  }
};

const generateNonce = () => `Sign this message to authenticate: ${randomBytes(16).toString('hex')}`;

const getNonceTtlMs = () => {
  const parsed = Number(process.env.NONCE_TTL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_NONCE_TTL_MS;
};

const upsertSession = (address, partial) => {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new Error('Invalid address');
  }
  const current = sessions.get(normalized) || {};
  const next = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  };
  sessions.set(normalized, next);
  return next;
};

const issueNonceForAddress = (address) => {
  const nonce = generateNonce();
  upsertSession(address, {
    nonce,
    issuedAt: Date.now(),
    authenticated: false,
  });
  return nonce;
};

const getNonceForAddress = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return null;
  }
  const entry = sessions.get(normalized);
  if (!entry?.nonce) {
    return null;
  }

  const ttl = getNonceTtlMs();
  if (entry.issuedAt && ttl && entry.issuedAt + ttl < Date.now()) {
    sessions.delete(normalized);
    return null;
  }

  return entry.nonce;
};

const clearSession = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return;
  }
  sessions.delete(normalized);
};

const markAddressAuthenticated = (address, extra = {}) => {
  upsertSession(address, {
    nonce: null,
    authenticated: true,
    authenticatedAt: Date.now(),
    ...extra,
  });
};

module.exports = {
  issueNonceForAddress,
  getNonceForAddress,
  markAddressAuthenticated,
  clearSession,
  normalizeAddress,
};
