const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads with Linux-compatible paths
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// TODO: This is insecure. Use a proper password hashing library like bcrypt.
// Hash password function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initialize SQLite database with Linux-compatible path
const dbPath = path.join(__dirname, 'marketplace.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Create tables with password field
db.serialize(() => {
  // Users table with password
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    password TEXT NOT NULL,
    university TEXT DEFAULT 'Chilanga North University',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_path TEXT,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (id)
  )`);

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    buyer_phone TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users (id),
    FOREIGN KEY (seller_id) REFERENCES users (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  console.log('Database tables initialized successfully');
});

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register user with password
app.post('/api/register', (req, res) => {
  const { student_id, name, phone_number, password } = req.body;
  
  if (!student_id || !name || !phone_number || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const hashedPassword = hashPassword(password);

  db.run(
    'INSERT INTO users (student_id, name, phone_number, password) VALUES (?, ?, ?, ?)',
    [student_id, name, phone_number, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Student ID already exists' });
        }
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ 
        message: 'User registered successfully', 
        user_id: this.lastID 
      });
    }
  );
});

// Login user with password
app.post('/api/login', (req, res) => {
  const { student_id, password } = req.body;
  
  if (!student_id || !password) {
    return res.status(400).json({ error: 'Student ID and password are required' });
  }

  const hashedPassword = hashPassword(password);
  
  db.get(
    'SELECT id, student_id, name, phone_number, university, created_at FROM users WHERE student_id = ? AND password = ?',
    [student_id, hashedPassword],
    (err, row) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(401).json({ error: 'Invalid student ID or password' });
      }
      res.json({ user: row });
    }
  );
});

// Get all products
app.get('/api/products', (req, res) => {
  db.all(
    `SELECT p.*, u.name as seller_name, u.phone_number as seller_phone 
     FROM products p 
     JOIN users u ON p.seller_id = u.id 
     WHERE p.status = 'available' 
     ORDER BY p.created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  db.all(
    `SELECT p.*, u.name as seller_name, u.phone_number as seller_phone 
     FROM products p 
     JOIN users u ON p.seller_id = u.id 
     WHERE p.category = ? AND p.status = 'available' 
     ORDER BY p.created_at DESC`,
    [category],
    (err, rows) => {
      if (err) {
        console.error('Error fetching products by category:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Add new product
app.post('/api/products', upload.single('image'), (req, res) => {
  const { seller_id, title, description, price, category, phone_number } = req.body;
  const image_path = req.file ? req.file.filename : null;

  if (!seller_id || !title || !price || !category || !phone_number) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  db.run(
    'INSERT INTO products (seller_id, title, description, price, category, image_path, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [seller_id, title, description, price, category, image_path, phone_number],
    function(err) {
      if (err) {
        console.error('Error adding product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ 
        message: 'Product added successfully', 
        product_id: this.lastID 
      });
    }
  );
});

// Create transaction
app.post('/api/transactions', (req, res) => {
  const { buyer_id, seller_id, product_id, amount, buyer_phone, seller_phone } = req.body;

  if (!buyer_id || !seller_id || !product_id || !amount || !buyer_phone || !seller_phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO transactions (buyer_id, seller_id, product_id, amount, buyer_phone, seller_phone) VALUES (?, ?, ?, ?, ?, ?)',
    [buyer_id, seller_id, product_id, amount, buyer_phone, seller_phone],
    function(err) {
      if (err) {
        console.error('Error creating transaction:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ 
        message: 'Transaction created successfully', 
        transaction_id: this.lastID 
      });
    }
  );
});

// Get user's products
app.get('/api/users/:id/products', (req, res) => {
  const { id } = req.params;
  
  db.all(
    'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
    [id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching user products:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get user's transactions
app.get('/api/users/:id/transactions', (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT t.*, p.title as product_title, u.name as seller_name 
     FROM transactions t 
     JOIN products p ON t.product_id = p.id 
     JOIN users u ON t.seller_id = u.id 
     WHERE t.buyer_id = ? OR t.seller_id = ? 
     ORDER BY t.created_at DESC`,
    [id, id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Chilanga North University Marketplace                    ║
║   Server running on http://localhost:${PORT}              ║
║   Network access: http://${HOST}:${PORT}                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
╚════════════════════════════════════════════════════════════╝
  `);
});