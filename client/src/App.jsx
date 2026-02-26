import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './App.css'

const API_URL = '/api'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get(`${API_URL}/users/me`)
        .then(res => setUser(res.data.data.user))
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (token, refreshToken, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext)
  return context
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let res;
      if (loginMethod === 'phone') {
        // Use dedicated OTP endpoint for phone login
        res = await axios.post(`${API_URL}/auth/send-otp`, { phone })
        setOtpSent(true)
        setError('')
      } else {
        res = await axios.post(`${API_URL}/users/login`, { email, password })
        login(res.data.data.accessToken, res.data.data.refreshToken, res.data.data.user)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    try {
      const verifyData = { phone, otp }
      const res = await axios.post(`${API_URL}/auth/verify-otp`, verifyData)
      login(res.data.accessToken, res.data.refreshToken, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed')
    }
  }

  const handleResendOtp = async () => {
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { phone })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP')
    }
  }

  const handleBackToLogin = () => {
    setOtpSent(false)
    setOtp('')
    setError('')
  }

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email')
    setError('')
  }

  return (
    <div className="auth-container">
      <h2>{otpSent ? 'Verify OTP' : 'Login'}</h2>
      {error && <div className="error">{error}</div>}
      
      {!otpSent ? (
        <form onSubmit={handleSubmit}>
          <div className="login-method-toggle">
            <button type="button" onClick={toggleLoginMethod} className="toggle-btn">
              Login with {loginMethod === 'email' ? 'Phone' : 'Email'}
            </button>
          </div>
          
          {loginMethod === 'email' ? (
            <>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </>
          ) : (
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              maxLength={10}
              required 
            />
          )}
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div className="otp-info">
            <p>Enter the 6-digit OTP sent to your {loginMethod === 'email' ? 'email' : 'phone number'}</p>
          </div>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={otp} 
            onChange={e => setOtp(e.target.value)} 
            maxLength={6}
            required 
          />
          <button type="submit">Verify OTP</button>
          <button type="button" className="resend-btn" onClick={handleResendOtp}>Resend OTP</button>
          <button type="button" className="back-btn" onClick={handleBackToLogin}>Back to Login</button>
        </form>
      )}
      
      {!otpSent && <p>Don't have an account? <Link to="/register">Register</Link></p>}
    </div>
  )
}

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/users/register`, { name, email, phone, password })
      login(res.data.data.accessToken, res.data.data.refreshToken, res.data.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Phone Number (10 digits)" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/products`, { params: { search, page, limit: 8 } })
      setProducts(res.data.data.products)
      setTotalPages(res.data.data.pagination.totalPages)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const addToCart = async (productId) => {
    if (!user) {
      alert('Please login to add items to cart')
      return
    }
    try {
      await axios.post(`${API_URL}/cart/items`, { productId, quantity: 1 })
      alert('Added to cart!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  return (
    <div className="products-page">
      <h2>Products</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit">Search</button>
      </form>
      
      {loading ? <p>Loading...</p> : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <h3>{product.name}</h3>
                <p className="description">{product.description}</p>
                <p className="price">₹ {product.price}</p>
                <p className="category">{product.category}</p>
                <p className="stock">Stock: {product.stock}</p>
                <button onClick={() => addToCart(product._id)}>Add to Cart</button>
              </div>
            ))}
          </div>
          
          {products.length === 0 && <p>No products found</p>}
          
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Cart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/cart`)
      setCart(res.data.data.cart)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const updateQuantity = async (productId, quantity) => {
    try {
      await axios.put(`${API_URL}/cart/items/${productId}`, { quantity })
      fetchCart()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity')
    }
  }

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${API_URL}/cart/items/${productId}`)
      fetchCart()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove item')
    }
  }

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/cart`)
      fetchCart()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear cart')
    }
  }

  if (loading) return <div className="cart-page">Loading...</div>

  return (
    <div className="cart-page">
      <h2>Shopping Cart</h2>
      
      {!cart || cart.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item._id} className="cart-item">
                <div className="item-info">
                  <h3>{item.product?.name || 'Product'}</h3>
                  <p className="price">₹{item.price}</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>+</button>
                  <button className="remove-btn" onClick={() => removeItem(item.product._id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <p>Total Items: {cart.totalQuantity}</p>
            <p>Total Price: ₹{cart.totalPrice}</p>
            <button className="clear-btn" onClick={clearCart}>Clear Cart</button>
          </div>
        </>
      )}
    </div>
  )
}

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <Link to="/" className="logo">E-Shop</Link>
      <nav>
        <Link to="/">Products</Link>
        {user && <Link to="/cart">Cart</Link>}
        {user ? (
          <>
            <span className="user-name">Hello, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Products />} />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
