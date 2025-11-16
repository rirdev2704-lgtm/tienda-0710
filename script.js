// Initialize cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch products from FakeStoreAPI
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Display products in cards
function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach(product => {
        const card = `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.title}">
                    <div class="card-body">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text">$${product.price}</p>
                        <button class="btn btn-primary" onclick="showProductDetails(${product.id})"><i class="fas fa-eye"></i> View More</button>
                    </div>
                </div>
            </div>`;
        productList.innerHTML += card;
    });
}

// Show product details in modal
async function showProductDetails(productId) {
    const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
    const product = await response.json();
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductImage').src = product.image;
    document.getElementById('modalProductCategory').textContent = product.category;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = product.price;
    document.getElementById('addToCartBtn').onclick = () => addToCart(product);
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

// Add product to cart
function addToCart(product) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    alert('Product added to cart! 🛒');
}

// Update cart display
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const li = `
            <li class="list-group-item">
                <span>${item.title} (x${item.quantity}) - $${itemTotal.toFixed(2)}</span>
                <div>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                    <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </li>`;
        cartItems.innerHTML += li;
    });
    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

// Update item quantity
function updateQuantity(index, quantity) {
    cart[index].quantity = parseInt(quantity);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Proceed to payment
document.getElementById('proceedToPayment').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty! 🛒');
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
});

// Confirm payment and generate ticket
document.getElementById('confirmPayment').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    if (!name || cardNumber.length !== 16 || !/^\d{2}\/\d{2}$/.test(expiry) || cvv.length !== 3) {
        alert('Please fill all fields correctly! 💳');
        return;
    }

    generateTicket(name);
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    alert('Payment successful! Ticket downloaded. ✅');
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
});

// Generate thermal-style ticket
function generateTicket(customerName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 100 + cart.length * 10] // 80mm wide, dynamic height
    });

    doc.setFont('Courier');
    doc.setFontSize(10);
    let y = 10;

    doc.text('ShopMaster', 40, y, { align: 'center' });
    y += 5;
    doc.text('------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.text(`Date: ${new Date().toLocaleString()}`, 5, y);
    y += 5;
    doc.text(`Customer: ${customerName}`, 5, y);
    y += 5;
    doc.text('------------------------', 40, y, { align: 'center' });
    y += 5;

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        doc.text(`${item.title.slice(0, 20)}`, 5, y);
        doc.text(`x${item.quantity} $${itemTotal.toFixed(2)}`, 60, y, { align: 'right' });
        y += 5;
    });

    y += 5;
    doc.text('------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.text(`Total: $${total.toFixed(2)}`, 60, y, { align: 'right' });

    doc.save('ShopMaster_Receipt.pdf');
}

// Initialize
fetchProducts();
updateCart();