// script/loadproductdetail.js

function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const fetchId = productId ? productId : 1;

    fetch(`/api/products/detail/${fetchId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Product not found');
            }
            return response.json();
        })
        .then(product => {
            document.title = `${product.name} - Haha Hihi Kidswear`;

            const nameEl = document.getElementById('product-name');
            if (nameEl) nameEl.textContent = product.name;

            const descEl = document.getElementById('product-desc');
            if (descEl) descEl.textContent = product.description;

            const priceEl = document.getElementById('product-price');
            if (priceEl) {
                priceEl.textContent = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(product.price);
            }

            const breadcrumbEl = document.getElementById('breadcrumb-text');
            if (breadcrumbEl) {
                let displayGender = product.gender.toUpperCase();
                if (displayGender === 'UNISEX') {
                    displayGender = 'BOY & GIRL';
                }
                breadcrumbEl.innerHTML = `<i class="bi bi-arrow-return-right"></i> ${displayGender} | ${product.category}`;
            }

            // Gambar dari product_images
            const imagesContainer = document.getElementById('product-images-container');
            const modalCarouselInner = document.getElementById('modal-carousel-inner');

            if (imagesContainer && modalCarouselInner && product.images && product.images.length > 0) {
                let galleryHTML = '';
                let carouselHTML = '';

                product.images.forEach((imgObj, index) => {
                    const imagePath = imgObj.image_path
                        .replace(/^\.\.\//, '/')
                        .replace(/^\.\//, '/');

                    galleryHTML += `
                        <div class="col-6 mb-3">
                            <img src="${imagePath}"
                             id="product-img-${index}"
                             alt="${product.name} 00${index + 1}"
                             class="img-fluid rounded img-thumbnail-link"
                             data-bs-toggle="modal"
                             data-bs-target="#productModal"
                             onclick="goToSlide(${index})">
                            <span class="img-label">00${index + 1}</span>
                        </div>
                    `;

                    const activeClass = index === 0 ? 'active' : '';
                    carouselHTML += `
                        <div class="carousel-item ${activeClass}">
                            <img src="${imagePath}" class="d-block w-100 rounded" alt="00${index + 1}">
                        </div>
                    `;
                });

                imagesContainer.innerHTML = galleryHTML;
                modalCarouselInner.innerHTML = carouselHTML;
            } else if (imagesContainer && modalCarouselInner) {
                const imagePath = product.image
                    ? product.image.replace(/^\.\.\//, '/').replace(/^\.\//, '/')
                    : '/asset/img/placeholder.jpg';
                imagesContainer.innerHTML = `
                    <div class="col-6 mb-3">
                        <img src="${imagePath}" alt="${product.name}" class="img-fluid rounded img-thumbnail-link" data-bs-toggle="modal" data-bs-target="#productModal" onclick="goToSlide(0)">
                        <span class="img-label">001</span>
                    </div>
                `;
                modalCarouselInner.innerHTML = `
                    <div class="carousel-item active">
                        <img src="${imagePath}" class="d-block w-100 rounded" alt="001">
                    </div>
                `;
            }

            // Ukuran dari product_sizes
            const sizesContainer = document.getElementById('product-sizes-container');
            const sizeSelectionArea = document.querySelector('.size-selection');
            const sizeHeading = sizeSelectionArea ? sizeSelectionArea.querySelector('h6') : null;

            if (sizesContainer && product.sizes && product.sizes.length > 0) {
                let sizesHTML = '';
                const isAccessory = product.category === 'Accessories';
                const isFruitCharms = product.name.toLowerCase().includes('fruit charms');

                if (sizeSelectionArea) sizeSelectionArea.style.display = 'block';

                if (isFruitCharms && sizeHeading) {
                    sizeHeading.textContent = 'Select Amount';
                } else if (isAccessory && sizeHeading) {
                    sizeHeading.textContent = 'Select Color';
                }

                product.sizes.forEach(size => {
                    const disabledStr = size.stock <= 0 ? 'disabled' : '';
                    if (isAccessory && !isFruitCharms) {
                        const isLight = ['#FFFFFF', '#ffffff', 'white', '#FFF', '#fff'].includes(size.size_name);
                        const borderStyle = isLight ? 'border: 1px solid #ddd;' : '';
                        sizesHTML += `
                            <button class="btn color-swatch size-btn"
                                    data-size="${size.size_name}"
                                    style="background-color: ${size.size_name}; width: 35px; height: 35px; border-radius: 50%; ${borderStyle} padding: 0;"
                                    ${disabledStr}>
                            </button>`;
                    } else {
                        const btnClass = size.stock <= 0 ? 'btn-outline-secondary' : 'btn-outline-dark';
                        sizesHTML += `<button class="btn ${btnClass} size-btn" data-size="${size.size_name}" ${disabledStr} style="padding: 0px 25px;">${size.size_name}</button>`;
                    }
                });
                sizesContainer.innerHTML = sizesHTML;

                let selectedSize = null;
                const sizeBtns = sizesContainer.querySelectorAll('.size-btn');

                if (sizeBtns.length === 1) {
                    const onlyBtn = sizeBtns[0];
                    if (!onlyBtn.hasAttribute('disabled')) {
                        setTimeout(() => onlyBtn.click(), 100);
                    }
                }

                sizeBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const target = e.currentTarget;
                        if (isAccessory && !isFruitCharms) {
                            sizeBtns.forEach(b => {
                                b.style.outline = 'none';
                                b.style.boxShadow = 'none';
                                b.style.transform = 'scale(1)';
                            });
                            target.style.outline = '2px solid #000';
                            target.style.outlineOffset = '2px';
                            target.style.transform = 'scale(1.1)';
                        } else {
                            sizeBtns.forEach(b => {
                                if (!b.hasAttribute('disabled')) {
                                    b.classList.remove('btn-dark');
                                    b.classList.add('btn-outline-dark');
                                }
                            });
                            target.classList.remove('btn-outline-dark');
                            target.classList.add('btn-dark');
                        }
                        selectedSize = target.getAttribute('data-size');
                    });
                });

                // Add to Cart
                const addToCartBtn = document.getElementById('add-to-cart-btn');
                const totalStock = product.sizes.reduce((acc, size) => acc + size.stock, 0);

                if (totalStock <= 0) {
                    if (sizeSelectionArea) sizeSelectionArea.style.display = 'none';
                    if (sizesContainer) sizesContainer.innerHTML = '';

                    if (addToCartBtn) {
                        addToCartBtn.disabled = true;
                        addToCartBtn.textContent = "Out Of Stock";
                        addToCartBtn.classList.remove('btn-dark');
                        addToCartBtn.classList.add('btn-secondary');
                        addToCartBtn.style.pointerEvents = 'auto';
                        addToCartBtn.style.cursor = 'not-allowed';
                    }
                } else if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', () => {
                        const userStr = localStorage.getItem('user');
                        if (!userStr) {
                            window.location.href = "/signin.html";
                            return;
                        }

                        if (!selectedSize) {
                            showOverlay("Please select a size first.", false);
                            return;
                        }

                        const user = JSON.parse(userStr);
                        const userId = user.id;

                        fetch('/api/cart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                user_id: userId,
                                product_id: product.id,
                                size: selectedSize,
                                quantity: 1
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                showOverlay("Failed to add product to cart: " + data.error, false);
                            } else {
                                showOverlay("Product successfully added to cart!", true, "/cart.html");
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            showOverlay("An error occurred while contacting the server.", false);
                        });
                    });
                }

            } else if (sizesContainer) {
                if (sizeSelectionArea) sizeSelectionArea.style.display = 'none';
                sizesContainer.innerHTML = '';

                const addToCartBtn = document.getElementById('add-to-cart-btn');
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.textContent = "Out Of Stock";
                    addToCartBtn.classList.remove('btn-dark');
                    addToCartBtn.classList.add('btn-secondary');
                    addToCartBtn.style.pointerEvents = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching product detail:', error);
            const nameEl = document.getElementById('product-name');
            if (nameEl) nameEl.textContent = "Product not found";
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail();
});