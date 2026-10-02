import jwt from 'jsonwebtoken'

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

  const runtimeConfig = typeof useRuntimeConfig === 'function' ? useRuntimeConfig(event) || {} : {}
  const secret = process.env[configKey] || runtimeConfig[configKey]
  if (!secret) {
    throw new Error(`${configKey} is required`)
  }

  return secret
}

export function signJwt(payload, tokenType, event) {
  const secret = getJwtSecret(tokenType, event)
  if (
    !Number.isFinite(payload?.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000) ||
    payload.data?.type !== tokenType
  ) {
    throw new Error('JWT payload must include a future expiry and matching role')
  }

  return jwt.sign(payload, secret, { algorithm: 'HS256' })
}

export function verifyJwt(token, tokenType, event) {
  const decoded = jwt.verify(token, getJwtSecret(tokenType, event), {
    algorithms: ['HS256']
  })

  if (
    !decoded ||
    typeof decoded !== 'object' ||
    !Number.isFinite(decoded.exp) ||
    decoded.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error('Invalid or expired JWT')
  }

  if (decoded.data?.type !== tokenType) {
    throw new Error('Invalid JWT role')
  }

  return decoded
}
