/**
 * Product Model
 * Mongoose schema for products with search and pagination support
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  category: {
    type: String,
    required: true,
    trim: true
  },

  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  image: {
    type: String,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Text index for search on name and description
productSchema.index({ name: 'text', description: 'text' });

// Regular indexes for filtering
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

/**
 * Static method to search products with pagination
 * @param {object} options - Search options
 * @param {string} options.search - Search query for name/description
 * @param {string} options.category - Filter by category
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @returns {Promise<object>} Paginated products
 */
productSchema.statics.search = async function({ search, category, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const query = { isActive: true };

  // Search by name or description using regex
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [products, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.countDocuments(query).exec()
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Static method to get all products (simple version)
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of products
 */
productSchema.statics.getAll = async function(options = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const query = { isActive: true };
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.find(query).sort(sort).skip(skip).limit(limit).exec(),
    this.countDocuments(query).exec()
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Static method to find product by ID
 * @param {string} id - Product ID
 * @returns {Promise<object|null>} Product or null
 */
productSchema.statics.findById = function(id) {
  return this.findOne({ _id: id, isActive: true }).exec();
};

/**
 * Static method to find product by ID (including inactive)
 * @param {string} id - Product ID
 * @returns {Promise<object|null>} Product or null
 */
productSchema.statics.findByIdAny = function(id) {
  return this.findById(id).exec();
};

module.exports = mongoose.model('Product', productSchema);
