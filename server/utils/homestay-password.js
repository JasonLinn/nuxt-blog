import bcrypt from 'bcryptjs'

export async function verifyHomestayPassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string' || !hash) return false
  return bcrypt.compare(password, hash)
}
