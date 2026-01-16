// Global variables
let currentUser = null;
let currentProducts = [];
let currentCategory = 'all';

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addProductBtn = document.getElementById('addProductBtn');

const welcomeSection = document.getElementById('welcomeSection');
const productsSection = document.getElementById('productsSection');
const dashboardSection = document.getElementById('dashboardSection');

const productsGrid = document.getElementById('productsGrid');
const myProductsGrid = document.getElementById('myProductsGrid');
const transactionsList = document.getElementById('transactionsList');

// Modals
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const addProductModal = document.getElementById('addProductModal');
const buyProductModal = document.getElementById('buyProductModal');

// Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const addProductForm = document.getElementById('addProductForm');
const buyProductForm = document.getElementById('buyProductForm');

// Loading and notification
const loadingSpinner = document.getElementById('loadingSpinner');
const notification = document.getElementById('notification');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProducts();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showWelcome();
    }
}

function setupEventListeners() {
    // Navigation buttons
    loginBtn.addEventListener('click', () => showModal('loginModal'));
    registerBtn.addEventListener('click', () => showModal('registerModal'));
    logoutBtn.addEventListener('click', logout);
    addProductBtn.addEventListener('click', () => showModal('addProductModal'));

    // Switch between login and register
    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal('registerModal');
            showModal('loginModal');
        });
    }

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            loadProducts();
        });
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'my-products') {
                loadMyProducts();
            } else if (tabName === 'my-transactions') {
                loadMyTransactions();
            }
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    addProductForm.addEventListener('submit', handleAddProduct);
    buyProductForm.addEventListener('submit', handleBuyProduct);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Navigation functions
function showWelcome() {
    welcomeSection.style.display = 'block';
    productsSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    loginBtn.style.display = 'inline-flex';
    registerBtn.style.display = 'inline-flex';
    logoutBtn.style.display = 'none';
}

function showDashboard() {
    welcomeSection.style.display = 'none';
    productsSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-flex';
    loadMyProducts();
}

// API functions
async function apiCall(url, options = {}) {
    try {
        showLoading();
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// User authentication
async function handleLogin(e) {
    e.preventDefault();
    const studentId = document.getElementById('loginStudentId').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!studentId || !password) {
        showNotification('Please enter both Student ID and Password', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/api/login', {
            method: 'POST',
            body: JSON.stringify({ 
                student_id: studentId,
                password: password
            })
        });
        
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Login successful! Welcome back!', 'success');
        hideModal('loginModal');
        loginForm.reset();
        showDashboard();
    } catch (error) {
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('regStudentId').value.trim();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validation
    if (!studentId || !name || !phone || !password || !confirmPassword) {
        showNotification('All fields are required', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/api/register', {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                name: name,
                phone_number: phone,
                password: password
            })
        });
        
        showNotification('Registration successful! Please login with your credentials.', 'success');
        hideModal('registerModal');
        registerForm.reset();
        showModal('loginModal');
    } catch (error) {
        console.error('Registration error:', error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully!', 'info');
    showWelcome();
    loadProducts();
}

// Product functions
async function loadProducts() {
    try {
        let url = '/api/products';
        if (currentCategory !== 'all') {
            url = `/api/products/category/${currentCategory}`;
        }
        
        const products = await apiCall(url);
        currentProducts = products;
        displayProducts(products, productsGrid);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products, container) {
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="no-products"><p>No products found in this category.</p></div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.image_path ? `/uploads/${product.image_path}` : '/img/placeholder.svg'}" 
             alt="${product.title}" class="product-image" 
             onerror="this.src='/img/placeholder.svg'">
        <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${product.description || 'No description provided'}</p>
            <div class="product-price">ZMW ${product.price}</div>
            <span class="product-category">${product.category}</span>
            <p class="product-seller">Sold by: ${product.seller_name}</p>
            ${currentUser ? `<button class="btn btn-primary" onclick="openBuyModal(${product.id})">Buy Now</button>` : '<p class="login-prompt">Login to buy this product</p>'}
        </div>
    `;
    return card;
}

async function loadMyProducts() {
    if (!currentUser) return;
    
    try {
        const products = await apiCall(`/api/users/${currentUser.id}/products`);
        displayProducts(products, myProductsGrid);
    } catch (error) {
        console.error('Error loading my products:', error);
    }
}

async function loadMyTransactions() {
    if (!currentUser) return;
    
    try {
        const transactions = await apiCall(`/api/users/${currentUser.id}/transactions`);
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function displayTransactions(transactions) {
    transactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="no-transactions"><p>No transactions found.</p></div>';
        return;
    }
    
    transactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.product_title}</h4>
                <p>Amount: ZMW ${transaction.amount}</p>
                <p>Date: ${new Date(transaction.created_at).toLocaleDateString()}</p>
            </div>
            <div class="transaction-status status-${transaction.status}">
                ${transaction.status}
            </div>
        `;
        transactionsList.appendChild(transactionItem);
    });
}

// Add product
async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('seller_id', currentUser.id);
    formData.append('title', document.getElementById('productTitle').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('category', document.getElementById('productCategory').value);
    formData.append('phone_number', document.getElementById('productPhone').value);
    
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        showLoading();
        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add product');
        }
        
        showNotification('Product added successfully!', 'success');
        hideModal('addProductModal');
        addProductForm.reset();
        loadMyProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Buy product
function openBuyModal(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('buyProductInfo').innerHTML = `
        <div class="product-info">
            <h3>${product.title}</h3>
            <p>Price: ZMW ${product.price}</p>
            <p>Seller: ${product.seller_name}</p>
        </div>
    `;
    
    document.getElementById('sellerPhoneDisplay').textContent = product.seller_phone;
    document.getElementById('amountDisplay').textContent = product.price;
    
    // Store product data for form submission
    buyProductForm.dataset.productId = productId;
    buyProductForm.dataset.sellerId = product.seller_id;
    buyProductForm.dataset.amount = product.price;
    buyProductForm.dataset.sellerPhone = product.seller_phone;
    
    showModal('buyProductModal');
}

async function handleBuyProduct(e) {
    e.preventDefault();
    
    const buyerPhone = document.getElementById('buyerPhone').value;
    const productId = buyProductForm.dataset.productId;
    const sellerId = buyProductForm.dataset.sellerId;
    const amount = buyProductForm.dataset.amount;
    const sellerPhone = buyProductForm.dataset.sellerPhone;
    
    try {
        await apiCall('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
                buyer_id: currentUser.id,
                seller_id: sellerId,
                product_id: productId,
                amount: amount,
                buyer_phone: buyerPhone,
                seller_phone: sellerPhone
            })
        });
        
        showNotification('Transaction created! Please complete the payment using mobile money.', 'success');
        hideModal('buyProductModal');
        buyProductForm.reset();
        
        // Show payment instructions
        setTimeout(() => {
            showNotification(`Send ZMW ${amount} to ${sellerPhone} using your mobile money service`, 'info');
        }, 2000);
        
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
}

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Create placeholder image if it doesn't exist
function createPlaceholderImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Create a simple placeholder
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 300, 200);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Image', 150, 100);
    
    return canvas.toDataURL();
}

// Service Worker for offline functionality (basic implementation)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}