import crypto from 'crypto';

/**
 * Calculate SHA-256 hash of a buffer
 * Used for document integrity verification
 * 
 * @param {Buffer} buffer - File buffer to hash
 * @returns {string} - Hexadecimal hash string
 */
export function calculateHash(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

/**
 * Verify if two hashes match
 * 
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {boolean} - True if hashes match
 */
export function verifyHash(hash1, hash2) {
  return hash1 === hash2;
}

/**
 * Calculate hash of a file path
 * 
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - Hash string
 */
export async function calculateFileHash(filePath) {
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(filePath);
  return calculateHash(buffer);
}