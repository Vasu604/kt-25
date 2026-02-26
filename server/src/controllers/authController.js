/**
 * Auth Controller
 * Handles user registration, login, and token refresh
 */

const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  config
} = require('../config/jwt');
const { saveOtp, verifyOtp: checkOtp } = require('../utils/otp.store');

/**
 * Register a new user
 * POST /api/users/register
 */
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password, name, phone } = req.body;

    // Create new user
    const user = await User.create({ email, password, name, phone });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token in user document
    await user.addRefreshToken(refreshToken);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Login user
 * POST /api/users/login
 */
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Email and password are required
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email).exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token in user document
    await user.addRefreshToken(refreshToken);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Refresh access token
 * POST /api/users/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user by ID
    const user = await User.findById(decoded.userId).exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === token);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    // Return new access token
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

/**
 * Logout user
 * POST /api/users/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      // Decode token to get user ID
      const decoded = verifyRefreshToken(token);
      if (decoded) {
        // Find user and remove the specific token
        const user = await User.findById(decoded.userId).exec();
        if (user) {
          await user.removeRefreshToken(token);
        }
      }
    }

    // If user ID is available from auth middleware, clear all tokens for that user
    if (req.userId) {
      const user = await User.findById(req.userId).exec();
      if (user) {
        await user.clearRefreshTokens();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

/**
 * Get current user profile
 * GET /api/users/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Send OTP
const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!/^[0-9]{10}$/.test(phone))
    return res.status(400).json({ message: "Invalid phone number" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  saveOtp(phone, otp);

  console.log(`OTP for phone ${phone}: ${otp}`);

  res.json({
    message: "OTP generated (demo mode)"
  });
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const isValid = checkOtp(phone, otp);

  if (!isValid)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    config.accessSecret,
    { expiresIn: config.accessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    config.refreshSecret,
    { expiresIn: config.refreshExpiry }
  );

  await user.addRefreshToken(refreshToken);

  res.json({ 
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: user.toJSON()
    }
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  sendOtp,
  verifyOtp
};
