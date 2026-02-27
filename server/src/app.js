require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import controllers
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');

// Import JWT config
const { authMiddleware } = require('./config/jwt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth Routes (public)
app.post('/api/users/register', authController.register);
app.post('/api/users/login', authController.login);
app.post('/api/users/refresh-token', authController.refreshToken);

// OTP Routes
app.post('/api/auth/send-otp', authController.sendOtp);
app.post('/api/auth/verify-otp', authController.verifyOtp);

// Protected auth routes
app.post('/api/users/logout', authMiddleware, authController.logout);
app.get('/api/users/me', authMiddleware, authController.getProfile);

// Product Routes (public)
app.get('/api/products', productController.getProducts);
app.get('/api/products/categories/list', productController.getCategories);
app.get('/api/products/:id', productController.getProductById);

// Protected product routes (admin only - middleware can be added later)
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);
app.delete('/api/products/clear', productController.clearProducts);

// Cart Routes (protected)
app.get('/api/cart', authMiddleware, cartController.getCart);
app.post('/api/cart/items', authMiddleware, cartController.addItem);
app.put('/api/cart/items/:productId', authMiddleware, cartController.updateItemQuantity);
app.delete('/api/cart/items/:productId', authMiddleware, cartController.removeItem);
app.delete('/api/cart', authMiddleware, cartController.clearCart);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Connect to MongoDB and start server
const mongoUri = process.env.DB_URI || process.env.MONGO_URI;

// Validate MongoDB URI
if (!mongoUri) {
  console.error('ERROR: MongoDB URI not configured. Please set DB_URI in .env file');
  console.log('Starting server without database...');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (without MongoDB)`);
  });
} else {
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('MongoDB connected successfully');
      
      // Clear all products on startup (remove seeded products)
      const Product = require('./models/Product');
      await Product.deleteMany({});
      console.log('Cleared all products from database');
      
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.log('Starting server without database...');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (without MongoDB)`);
      });
    });
}

module.exports = app;
