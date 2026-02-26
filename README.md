# E-Shop: Full-Stack E-Commerce Application

A modern full-stack e-commerce web application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🚀 Project Overview

E-Shop is a fully functional e-commerce platform featuring user authentication, product management, and shopping cart functionality. The application implements modern security practices with JWT-based authentication and supports both email/password and phone OTP login methods.

## 🏗️ Architecture

```
kd-kt-25/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx        # Main application with routing
│   │   ├── App.css       # Styling
│   │   └── main.jsx      # React entry point
│   └── package.json
│
└── server/                # Express.js Backend
    ├── src/
    │   ├── app.js         # Server entry point
    │   ├── config/
    │   │   ├── database.js    # MongoDB connection
    │   │   └── jwt.js          # JWT configuration & middleware
    │   ├── controllers/
    │   │   ├── authController.js     # Authentication logic
    │   │   ├── productController.js  # Product CRUD operations
    │   │   └── cartController.js     # Cart operations
    │   ├── models/
    │   │   ├── User.js        # User schema
    │   │   ├── Product.js     # Product schema
    │   │   └── Cart.js        # Cart schema
    │   └── utils/
    │       └── otp.store.js   # OTP storage utilities
    └── package.json
```

## ✨ Features

### 1. User Authentication System
- **Email/Password Login** - Traditional authentication with bcrypt password hashing
- **Phone OTP Login** - Password-less authentication using 6-digit OTP
- **User Registration** - New user sign-up with validation
- **JWT Token Management**:
  - Access tokens with 15-minute expiry
  - Refresh tokens with 7-day expiry
  - Token refresh endpoint for seamless session renewal
  - Secure logout with token revocation
- **Protected Routes** - Middleware for securing private endpoints

### 2. Product Catalog
- **Product Listing** - Paginated display (8 items per page)
- **Search Functionality** - Search products by name or description
- **Category Filtering** - Filter products by category
- **Product Details** - View individual product information
- **Stock Management** - Track inventory levels
- **Admin CRUD Operations** - Create, read, update, delete products
- **Auto-seeding** - 8 sample products automatically added on first server start

### 3. Shopping Cart
- **Add to Cart** - Add products with specified quantity
- **Update Quantity** - Increase or decrease item quantities
- **Remove Items** - Remove individual items from cart
- **Clear Cart** - Remove all items at once
- **Cart Totals** - Automatic calculation of total quantity and price
- **Persistent Storage** - Cart saved in MongoDB per user

### 4. Frontend User Interface
- **Responsive Design** - Modern CSS with grid layout
- **Authentication Flow** - Login/Register pages with OTP verification
- **Protected Routes** - Cart page only accessible to logged-in users
- **User Dashboard** - Display user name in header
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router DOM 6, Axios |
| **Backend** | Express.js 5, Node.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (Access + Refresh Tokens), OTP |
| **Security** | bcryptjs, CORS, Express Validator |
| **External Services** | Twilio (OTP SMS - ready for integration) |

## 🔐 Security Features

1. **Password Hashing** - Bcrypt with salt rounds for secure password storage
2. **JWT Authentication** - Secure token-based authentication
3. **Token Rotation** - Refresh tokens stored in database for security
4. **Token Expiry** - Short-lived access tokens (15 minutes)
5. **Input Validation** - Express Validator for request validation
6. **Protected Routes** - Auth middleware for private endpoints
7. **Error Handling** - Centralized error handling middleware
8. **CORS Protection** - Cross-Origin Resource Sharing enabled

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Register new user | Public |
| POST | `/api/users/login` | Login with email/password | Public |
| POST | `/api/users/refresh-token` | Refresh access token | Public |
| POST | `/api/users/logout` | Logout user | Protected |
| GET | `/api/users/me` | Get user profile | Protected |
| POST | `/api/auth/send-otp` | Send OTP to phone | Public |
| POST | `/api/auth/verify-otp` | Verify OTP and login | Public |

### Product Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products (paginated, searchable) | Public |
| GET | `/api/products/categories/list` | Get all categories | Public |
| GET | `/api/products/:id` | Get product by ID | Public |
| POST | `/api/products` | Create new product | Public* |
| PUT | `/api/products/:id` | Update product | Public* |
| DELETE | `/api/products/:id` | Delete product | Public* |

### Cart Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get user's cart | Protected |
| POST | `/api/cart/items` | Add item to cart | Protected |
| PUT | `/api/cart/items/:productId` | Update item quantity | Protected |
| DELETE | `/api/cart/items/:productId` | Remove item | Protected |
| DELETE | `/api/cart` | Clear entire cart | Protected |

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   cd kd-kt-25
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3000
   DB_URI=mongodb://localhost:27017/kd-kt-25
   JWT_ACCESS_SECRET=your_access_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   ```

### Running the Application

1. **Start MongoDB** (if using local instance)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server runs on http://localhost:3000

3. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on http://localhost:5173 (or port 3001)

### Testing the Application

1. Open browser to http://localhost:5173
2. Register a new account or login with existing credentials
3. Browse products, search, and add items to cart
4. View and manage your shopping cart

## 📊 Sample Products

The application automatically seeds the following sample products on first run:

| Name | Description | Price | Category |
|------|-------------|-------|----------|
| Laptop Pro | High performance laptop with 16GB RAM | ₹1299.99 | Electronics |
| Wireless Mouse | Ergonomic wireless mouse | ₹29.99 | Electronics |
| Smartphone | Latest model smartphone with great camera | ₹899.99 | Electronics |
| Coffee Maker | Automatic coffee maker with timer | ₹79.99 | Home |
| Running Shoes | Comfortable running shoes | ₹119.99 | Sports |
| Backpack | Durable backpack for laptop | ₹49.99 | Accessories |
| Desk Lamp | LED desk lamp with adjustable brightness | ₹34.99 | Home |
| Headphones | Noise cancelling headphones | ₹199.99 | Electronics |

## 🔧 Project Status

- ✅ User authentication (email/password + OTP)
- ✅ JWT token management with refresh
- ✅ Product catalog with search and pagination
- ✅ Shopping cart functionality
- ✅ Responsive UI design
- ✅ MongoDB integration
- ✅ Sample data seeding
- ✅ Error handling

## 📈 Future Enhancements

- Payment gateway integration (Razorpay, Stripe)
- Order management system
- Admin dashboard
- Email notifications
- SMS notifications via Twilio
- Image upload for products
- Order history
- Wishlist functionality
- Product reviews and ratings

## 📄 License

ISC License

## 👤 Author

Built with ❤️ using MERN Stack
