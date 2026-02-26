/**
 * Cart Model
 * Mongoose schema for user shopping cart
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

/**
 * Calculate cart totals
 */
cartSchema.methods.calculateTotals = function() {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return this;
};

/**
 * Add item to cart
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @param {number} price - Product price
 * @returns {Promise<object>} Updated cart
 */
cartSchema.methods.addItem = async function(productId, quantity, price) {
  // Check if product already exists in cart
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    // Update quantity
    existingItem.quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price
    });
  }
  
  // Recalculate totals
  this.calculateTotals();
  return this.save();
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 * @returns {Promise<object>} Updated cart
 */
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  this.calculateTotals();
  return this.save();
};

/**
 * Update item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @returns {Promise<object>} Updated cart
 */
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    return this.removeItem(productId);
  }
  
  item.quantity = quantity;
  this.calculateTotals();
  return this.save();
};

/**
 * Clear all items from cart
 * @returns {Promise<object>} Updated cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.totalQuantity = 0;
  this.totalPrice = 0;
  return this.save();
};

/**
 * Static method to find or create cart for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} User's cart
 */
cartSchema.statics.findOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

/**
 * Static method to find cart by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User's cart or null
 */
cartSchema.statics.findByUserId = async function(userId) {
  return this.findOne({ user: userId }).populate('items.product').exec();
};

// Index for faster queries
// (user: 1 index is already created by unique: true in schema)

module.exports = mongoose.model('Cart', cartSchema);
