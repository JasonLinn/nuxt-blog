const secretConfigKeys = {
  admin: 'JWT_SECRET_ADMIN',
  homestay: 'JWT_SECRET_HOMESTAY',
  user: 'JWT_SECRET_USER'
}

export function getJwtSecret(tokenType, event) {
  const configKey = secretConfigKeys[tokenType]
  if (!configKey) {
    throw new Error(`Unsupported JWT token type: ${tokenType}`)
  }

  const secret = process.env[configKey] || useRuntimeConfig(event)[configKey]
  if (!secret) {
    throw new Error(`${configKey} is required`)
  }

  return secret
}
