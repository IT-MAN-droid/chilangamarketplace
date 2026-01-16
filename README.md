# Chilanga North University Marketplace

A simple and efficient marketplace platform for university students to buy and sell items using mobile phone payments.

## Features

- **Student-only access** for Chilanga North University
- **Mobile payment integration** using phone numbers
- **Product categories**: Tomatoes, Vegetables, Clothes, Electronics, and more
- **Optimized for low network areas** in Lusaka, Zambia
- **Simple and user-friendly interface**
- **Real-time product listings**
- **Transaction tracking**

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (lightweight and fast)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **File Upload**: Multer for image handling
- **Offline Support**: Service Worker for basic offline functionality

## Installation

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Usage

### For Students

1. **Register**: Use your student ID, full name, and phone number
2. **Login**: Use your student ID to access the marketplace
3. **Browse Products**: Filter by categories (Tomatoes, Vegetables, Clothes, Electronics)
4. **Buy Products**: 
   - Click "Buy Now" on any product
   - Enter your phone number
   - Follow payment instructions to send money via mobile money
5. **Sell Products**:
   - Click "Add Product" in your dashboard
   - Fill in product details and your phone number
   - Upload an image (optional)

### Payment System

- Buyers enter their phone number when purchasing
- Sellers provide their phone number with product listings
- Payment is made using mobile money services (Airtel Money, MTN Mobile Money, etc.)
- The system provides clear payment instructions

## Database Schema

### Users Table
- `id`: Primary key
- `student_id`: Unique student identifier
- `name`: Full name
- `phone_number`: Mobile phone number
- `university`: Defaults to "Chilanga North University"

### Products Table
- `id`: Primary key
- `seller_id`: Foreign key to users
- `title`: Product name
- `description`: Product description
- `price`: Price in Zambian Kwacha (ZMW)
- `category`: Product category
- `image_path`: Path to product image
- `phone_number`: Seller's phone number
- `status`: Available/Sold status

### Transactions Table
- `id`: Primary key
- `buyer_id`: Foreign key to users
- `seller_id`: Foreign key to users
- `product_id`: Foreign key to products
- `amount`: Transaction amount
- `buyer_phone`: Buyer's phone number
- `seller_phone`: Seller's phone number
- `status`: Transaction status

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/products` - Get all products
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Add new product
- `POST /api/transactions` - Create transaction
- `GET /api/users/:id/products` - Get user's products
- `GET /api/users/:id/transactions` - Get user's transactions

## Optimization Features

- **Lightweight design** for low network areas
- **Minimal dependencies** for fast loading
- **Responsive design** for mobile devices
- **Service Worker** for basic offline functionality
- **Image optimization** with lazy loading
- **Simple UI** for easy navigation

## Security Features

- **University verification** (Chilanga North University only)
- **Input validation** on all forms
- **SQL injection protection** with parameterized queries
- **File upload restrictions** (images only)

## Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start
```

## File Structure

```
chilanga-marketplace/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── marketplace.db         # SQLite database (created automatically)
├── public/                # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   ├── script.js          # JavaScript functionality
│   ├── sw.js              # Service Worker
│   ├── img/               # Images directory
│   └── uploads/           # User uploaded images
└── README.md              # This file
```

## Contributing

This is a university-specific marketplace. For modifications or improvements, please contact the development team.

## License

MIT License - See LICENSE file for details.

## Support

For technical support or questions, please contact the university IT department.

---

**Chilanga North University Marketplace** - Connecting students through simple, secure trading.
