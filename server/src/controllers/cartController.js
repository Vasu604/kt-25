/**
 * Cart Controller
 * Handles cart operations: add, remove, update, clear, get
 */

const { validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    // Find or create cart for user
    const cart = await Cart.findOrCreate(userId);

    res.status(200).json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
};

/**
 * Add item to cart
 * POST /api/cart/items
 */
const addItem = async (req, res) => {
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

    const userId = req.userId;
    const { productId, quantity = 1 } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        available: product.stock
      });
    }

    // Find or create cart
    const cart = await Cart.findOrCreate(userId);

    // Add item to cart
    await cart.addItem(productId, quantity, product.price);

    // Reload cart with populated product data
    const updatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Add item error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding item to cart'
    });
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:productId
 */
const removeItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item from cart
    await cart.removeItem(productId);

    // Reload cart with populated product data
    const updatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Remove item error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing item from cart'
    });
  }
};

/**
 * Update item quantity
 * PUT /api/cart/items/:productId
 */
const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check stock if increasing quantity
    if (quantity > 0) {
      const existingItem = cart.items.find(
        item => item.product.toString() === productId
      );
      
      if (existingItem) {
        const product = await Product.findById(productId);
        if (product && product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock',
            available: product.stock
          });
        }
      }
    }

    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);

    // Reload cart with populated product data
    const updatedCart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: { cart: updatedCart }
    });
  } catch (error) {
    console.error('Update item error:', error);

    if (error.message === 'Item not found in cart') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating cart'
    });
  }
};

/**
 * Clear all items from cart
 * DELETE /api/cart
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: { cart }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  }
};

module.exports = {
  getCart,
  addItem,
  removeItem,
  updateItemQuantity,
  clearCart
};
