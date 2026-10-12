// script/cart.js

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = "/signin.html";
        return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    loadCart(userId);
});

function loadCart(userId) {
    const container = document.getElementById('cart-items-container');
    const countEl = document.getElementById('cart-items-count');
    const totalEl = document.getElementById('total-price');

    if (!container) return;

    fetch(`/api/cart?user_id=${userId}`)
        .then(response => response.json())
        .then(items => {
            if (items.error) throw new Error(items.error);

            if (items.length === 0) {
                countEl.textContent = 'Items (0)';
                container.innerHTML = '<p class="text-center text-muted py-4">Your cart is empty.</p>';
                if (totalEl) totalEl.textContent = 'Rp0';

                const checkoutBtn = document.getElementById('checkoutBtn');
                if (checkoutBtn) {
                    checkoutBtn.classList.add('disabled');
                    checkoutBtn.setAttribute('href', '#');
                    checkoutBtn.onclick = (e) => e.preventDefault();
                }

                const removeAllBtn = document.getElementById('removeAllBtn');
                if (removeAllBtn) removeAllBtn.style.display = 'none';

                return;
            }

            countEl.textContent = `Items (${items.length})`;
            const removeAllBtn = document.getElementById('removeAllBtn');
            if (removeAllBtn) {
                removeAllBtn.style.display = 'block';
                removeAllBtn.onclick = () => removeAllItems(userId);
            }

            let htmlContent = '';
            let subtotal = 0;

            items.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;

                const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
                }).format(item.price);

                const imagePath = item.image
                    ? item.image.replace(/^\.\.\//, '/').replace(/^\.\//, '/')
                    : '/asset/img/placeholder.jpg';

                const isMinusDisabled = item.quantity <= 1 ? 'disabled style="cursor: not-allowed; pointer-events: auto; opacity: 0.5;"' : '';
                const isPlusDisabled = item.quantity >= item.stock ? 'disabled style="cursor: not-allowed; pointer-events: auto; opacity: 0.5;"' : '';

                htmlContent += `
                    <div class="row align-items-center cart-item py-3">
                        <div class="col-4 col-md-2">
                            <img src="${imagePath}" alt="${item.name}" class="img-fluid rounded cart-item-img">
                        </div>
                        <div class="col-8 col-md-4">
                            <h6 class="fw-bold mb-1">${item.name}</h6>
                            ${item.name.toLowerCase().includes('fruit charms') ?
                                `<p class="text-muted small mb-0">Amount: ${item.size}</p>` :
                                (item.category && item.category.toLowerCase() === 'accessories' ?
                                    (function() {
                                        const colorMap = {
                                            '#000000': 'Black',
                                            '#FFFFFF': 'White',
                                            '#B22222': 'Red',
                                            '#404684': 'Blue',
                                            '#FFFF00': 'Yellow',
                                            '#808080': 'Gray',
                                            '#F4E1EB': 'Pink',
                                            '#D6D1CB': 'Khaki',
                                            '#EAEAEA': 'Light Gray',
                                            '#677BB0': 'Blue',
                                            '#F9DF92': 'Yellow',
                                        };
                                        const colorName = colorMap[item.size.toUpperCase()] || item.size;
                                        return `
                                            <p class="text-muted small mb-0 d-flex align-items-center">
                                                Color: ${colorName} <span class="ms-1" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${item.size}; border:1px solid #ddd;"></span>
                                            </p>`;
                                    })() :
                                    `<p class="text-muted small mb-0">Size: ${item.size}</p>`)
                            }
                        </div>
                        <div class="col-6 col-md-3 mt-3 mt-md-0 d-flex align-items-center">
                            <button class="btn btn-outline-dark btn-sm px-2" ${isMinusDisabled} onclick="updateQuantity(${item.cart_id}, ${item.quantity - 1}, ${userId}, ${item.stock})"><i class="bi bi-dash"></i></button>
                            <input type="number" class="form-control form-control-sm text-center mx-2 quantity-input" value="${item.quantity}" readonly>
                            <button class="btn btn-outline-dark btn-sm px-2" ${isPlusDisabled} onclick="updateQuantity(${item.cart_id}, ${item.quantity + 1}, ${userId}, ${item.stock})"><i class="bi bi-plus"></i></button>
                        </div>
                        <div class="col-6 col-md-3 mt-3 mt-md-0 text-end">
                            <p class="fw-bold mb-1">${formattedPrice}</p>
                            <button class="btn btn-link text-danger p-0 text-decoration-none small" onclick="removeItem(${item.cart_id}, ${userId})"><i class="bi bi-trash3 me-1"></i> Remove</button>
                        </div>
                    </div>
                `;

                if (index < items.length - 1) {
                    htmlContent += '<hr class="text-muted my-0">';
                }
            });

            container.innerHTML = htmlContent;

            const format = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
            totalEl.textContent = format(subtotal);
        })
        .catch(error => {
            console.error('Error fetching cart:', error);
            container.innerHTML = '<p class="text-center text-danger py-4">Gagal memuat keranjang.</p>';
        });
}

window.updateQuantity = function(cartId, newQuantity, userId, maxStock) {
    if (newQuantity < 1) return;

    if (newQuantity > maxStock) {
        showOverlay(`Maaf, stok hanya tersedia ${maxStock} item untuk ukuran ini.`, false);
        return;
    }

    fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
    })
    .then(response => response.json())
    .then(data => {
        loadCart(userId);
    })
    .catch(error => console.error('Error updating quantity:', error));
};

window.removeItem = function(cartId, userId) {
    showOverlay("Are you sure you want to remove this item from your cart?", false, null, true, () => {
        fetch(`/api/cart/${cartId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            showOverlay("Item has been removed from the cart.", true);
            loadCart(userId);
        })
        .catch(error => {
            console.error('Error removing item:', error);
            showOverlay("Error Removing Item.", false);
        });
    });
};

window.removeAllItems = function(userId) {
    showOverlay("Are you sure you want to remove ALL items from your cart?", false, null, true, () => {
        fetch(`/api/cart/user/${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            showOverlay("Your cart has been cleared.", true);
            loadCart(userId);
        })
        .catch(error => {
            console.error('Error clearing cart:', error);
            showOverlay("Error Clearing Cart.", false);
        });
    });
};