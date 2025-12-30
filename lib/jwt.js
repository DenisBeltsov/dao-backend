const DEFAULT_EXPIRATION = '2h'

const getJwtSecret = () => {
  const value = process.env.JWT_SECRET
  if (!value || !value.trim()) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }
  return value.trim()
}

const getJwtExpiration = () => {
  if (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.trim()) {
    return process.env.JWT_EXPIRES_IN.trim()
  }
  return DEFAULT_EXPIRATION
}

module.exports = {
  getJwtSecret,
  getJwtExpiration,
}
