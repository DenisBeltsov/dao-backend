const jwt = require('jsonwebtoken')
const { getJwtSecret } = require('../lib/jwt')

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required' })
  }

  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware
