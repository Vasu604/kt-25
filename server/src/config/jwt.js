/**
 * JWT Configuration
 * Centralizes JWT settings and token generation utilities
 */

require('dotenv').config();

const jwt = require('jsonwebtoken');

const config = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key_very_secure',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_very_secure',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
};

/**
 * Generate access token
 * @param {string} userId - User ID
 * @returns {string} JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    config.accessSecret,
    { expiresIn: config.accessExpiry }
  );
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.refreshSecret,
    { expiresIn: config.refreshExpiry }
  );
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {object|null} Decoded token or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.accessSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Express middleware to verify access token
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {object|null} Decoded token or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.refreshSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  config,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authMiddleware
};
