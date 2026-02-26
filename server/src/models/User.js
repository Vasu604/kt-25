/**
 * User Model
 * Mongoose schema for user authentication with bcrypt and JWT
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/jwt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ''
  },

  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    default: ''
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    default: ''
  },

  refreshTokens: [
    {
      token: { type: String, required: true },
      expiresAt: { type: Date, required: true }
    }
  ]
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Skip hashing if password is empty (for OTP-based users)
  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = function(password) {
  // If password is empty, return false (except for OTP users where both are empty)
  if (!password || !this.password) return password === this.password;
  return bcrypt.compare(password, this.password);
};

// Generate access token method
userSchema.methods.generateAccessToken = function() {
  return jwt.sign({ userId: this._id }, config.accessSecret, { expiresIn: config.accessExpiry });
};

// Generate refresh token method
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({ userId: this._id }, config.refreshSecret, { expiresIn: config.refreshExpiry });
};

// Add refresh token to user
userSchema.methods.addRefreshToken = function(token, expiresInDays = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  this.refreshTokens.push({ token, expiresAt });
  return this.save();
};

// Remove refresh token from user
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Clear all refresh tokens
userSchema.methods.clearRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by phone
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

// Static method to find by ID
userSchema.statics.findById = function(id) {
  return mongoose.model('User').findById(id);
};

// Convert to JSON (excludes password and refreshTokens)
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

// Indexes
userSchema.index({ createdAt: 1 });

module.exports = mongoose.model('User', userSchema);
