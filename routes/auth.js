const express = require('express');
const { requestNonce, verifySignature } = require('../controllers/authController');

const router = express.Router();

router.get('/nonce', requestNonce);
router.post('/verify', verifySignature);

module.exports = router;
