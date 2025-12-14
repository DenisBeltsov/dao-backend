const { ethers } = require('ethers');
const {
  issueNonceForAddress,
  getNonceForAddress,
  markAddressAuthenticated,
  clearSession,
  normalizeAddress,
} = require('../store/authStore');

const extractAddress = (value) => {
  const normalized = normalizeAddress(value);
  if (!normalized) {
    throw new Error('Invalid wallet address');
  }
  return normalized;
};

const requestNonce = (req, res) => {
  try {
    const address = extractAddress(req.query.address);
    const nonce = issueNonceForAddress(address);

    res.json({ nonce });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to issue nonce' });
  }
};

const verifySignature = (req, res) => {
  try {
    const address = extractAddress(req.body?.address);
    const { signature, chainId } = req.body || {};

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ message: 'Signature is required' });
    }

    const nonce = getNonceForAddress(address);
    if (!nonce) {
      return res.status(400).json({ message: 'Nonce not found or expired. Request a new one.' });
    }

    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(nonce, signature);
    } catch (error) {
      return res.status(400).json({ message: 'Failed to verify signature' });
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      clearSession(address);
      return res.status(401).json({ message: 'Signature does not match the wallet address' });
    }

    markAddressAuthenticated(address, { chainId });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to verify signature' });
  }
};

module.exports = {
  requestNonce,
  verifySignature,
};
