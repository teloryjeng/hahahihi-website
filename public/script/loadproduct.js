function loadProducts(container) {
    const category = container.getAttribute('data-category') || '';
    const gender = container.getAttribute('data-gender') || '';
    const fetchType = container.getAttribute('data-fetch-type') || 'filter';

    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const searchQuery = urlParams.get('q') || '';
    const sort = urlParams.get('sort') || 'newest';

    let apiUrl = '';

    if (fetchType === 'new') {
        apiUrl = `/api/products/new-arrivals?limit=8&page=${page}&sort=${sort}`;
    } else {
        apiUrl = `/api/products/filter?category=${category}&gender=${gender}&page=${page}&limit=8&sort=${sort}`;
        if (searchQuery) {
            apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
            const searchTitle = document.getElementById('search-title');
            if (searchTitle) {
                searchTitle.textContent = `Search Results for "${searchQuery}"`;
            }
        }
    }

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const products = data.products || [];
            const currentPage = data.currentPage || 1;
            const totalPages = data.totalPages || 1;

            let htmlContent = '';

            if (products.length === 0) {
                container.innerHTML = '<p class="text-center w-100">Belum ada produk di kategori ini.</p>';
                updatePagination(0, 0);
                return;
            }

            products.forEach(product => {
                const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(product.price);

                // Normalisasi path gambar ke absolut
                let imagePath = product.image
                    .replace(/^\.\.\//, '/')
                    .replace(/^\.\//, '/');

                htmlContent += `
                    <div class="col-6 col-md-3">
                        <a href="/product-detail.html?id=${product.id}" class="product-link">
                            <div class="product-card-interactive">
                                <img src="${imagePath}" alt="${product.name}" class="img-fluid mb-2" style="background-color: #ebebeb;">
                                <h6>${product.name}</h6>
                                <p>${formattedPrice}</p>
                            </div>
                        </a>
                    </div>
                `;
            });

            container.innerHTML = htmlContent;
            updatePagination(currentPage, totalPages);
        })
        .catch(error => {
            console.error('Gagal memuat produk:', error);
            container.innerHTML = '<p class="text-center text-danger w-100">Gagal terhubung ke database.</p>';
        });
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const buildUrl = (page) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        return '?' + params.toString();
    };

    let html = '';

    if (currentPage > 1) {
        html += `<li class="page-item"><a class="page-link text-dark" href="${buildUrl(currentPage - 1)}">Previous</a></li>`;
    } else {
        html += `<li class="page-item disabled"><a class="page-link text-dark" href="#" tabindex="-1" aria-disabled="true">Previous</a></li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<li class="page-item active" aria-current="page"><a class="page-link bg-dark border-dark text-white" href="#">${i}</a></li>`;
        } else {
            html += `<li class="page-item"><a class="page-link text-dark" href="${buildUrl(i)}">${i}</a></li>`;
        }
    }

    if (currentPage < totalPages) {
        html += `<li class="page-item"><a class="page-link text-dark" href="${buildUrl(currentPage + 1)}">Next</a></li>`;
    } else {
        html += `<li class="page-item disabled"><a class="page-link text-dark" href="#" tabindex="-1" aria-disabled="true">Next</a></li>`;
    }

    paginationContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('product-container');
    if (container) {
        loadProducts(container);
        setupFilterUI();
    }
});

function setupFilterUI() {
    const filterBtn = document.querySelector('.filter-btn');
    if (!filterBtn) return;

    const urlParams = new URLSearchParams(window.location.search);
    const currentSort = urlParams.get('sort') || 'newest';

    const getSortUrl = (sortType) => {
        const params = new URLSearchParams(window.location.search);
        params.set('sort', sortType);
        params.set('page', 1);
        return '?' + params.toString();
    };

    const parent = filterBtn.parentElement;
    if (parent) {
        parent.classList.add('dropdown');
    }

    filterBtn.setAttribute('data-bs-toggle', 'dropdown');
    filterBtn.setAttribute('aria-expanded', 'false');

    const dropdownMenuHTML = `
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
            <li><a class="dropdown-item ${currentSort === 'newest' ? 'active bg-dark text-white' : ''}" href="${getSortUrl('newest')}">Newest</a></li>
            <li><a class="dropdown-item ${currentSort === 'oldest' ? 'active bg-dark text-white' : ''}" href="${getSortUrl('oldest')}">Oldest</a></li>
            <li><a class="dropdown-item ${currentSort === 'price_asc' ? 'active bg-dark text-white' : ''}" href="${getSortUrl('price_asc')}">Price: Low to High</a></li>
            <li><a class="dropdown-item ${currentSort === 'price_desc' ? 'active bg-dark text-white' : ''}" href="${getSortUrl('price_desc')}">Price: High to Low</a></li>
        </ul>
    `;

    filterBtn.insertAdjacentHTML('afterend', dropdownMenuHTML);
}