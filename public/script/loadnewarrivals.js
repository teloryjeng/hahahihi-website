function loadNewArrivals(callback) {
    const container = document.getElementById('new-arrivals-container');
    if (!container) return;

    const apiUrl = `/api/products/new-arrivals?limit=12`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            let htmlContent = '';
            const products = data.products || [];

            if (products.length === 0) {
                container.innerHTML = '<p class="text-center w-100">Belum ada produk baru.</p>';
                return;
            }

            products.forEach(product => {
                const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(product.price);

                // Normalisasi path gambar ke absolut
                const imagePath = product.image
                    .replace(/^\.\.\//, '/')
                    .replace(/^\.\//, '/');

                htmlContent += `
                    <div style="flex: 0 0 calc((100% - 72px) / 4); max-width: calc((100% - 72px) / 4);">
                        <a href="/product-detail.html?id=${product.id}" class="product-link">
                            <div class="product-card interactive">
                                <img src="${imagePath}" alt="${product.name}" class="img-fluid mb-2" style="background-color: #ebebeb; border-radius: 8px;">
                                <h6>${product.name}</h6>
                                <p>${formattedPrice}</p>
                            </div>
                        </a>
                    </div>
                `;
            });

            container.innerHTML = htmlContent;

            if (typeof callback === 'function') {
                callback();
            }
        })
        .catch(error => {
            console.error('Gagal memuat produk:', error);
            container.innerHTML = '<p class="text-center text-danger w-100">Gagal terhubung ke database.</p>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const $container = $('#new-arrivals-container');
    const $scrollLeftBtn = $('#scrollLeftBtn');
    const $scrollRightBtn = $('#scrollRightBtn');

    if ($container.length && $scrollLeftBtn.length && $scrollRightBtn.length) {
        const updateArrows = () => {
            const container = $container[0];
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScroll = scrollWidth - clientWidth;

            if (scrollLeft <= 5) {
                $scrollLeftBtn.css({ 'opacity': '0', 'pointer-events': 'none' });
            } else {
                $scrollLeftBtn.css({ 'opacity': '1', 'pointer-events': 'auto' });
            }

            if (maxScroll <= 0 || scrollLeft >= maxScroll - 5) {
                $scrollRightBtn.css({ 'opacity': '0', 'pointer-events': 'none' });
            } else {
                $scrollRightBtn.css({ 'opacity': '1', 'pointer-events': 'auto' });
            }
        };

        $container.on('scroll', updateArrows);

        loadNewArrivals(() => {
            setTimeout(updateArrows, 100);
        });

        $scrollLeftBtn.on('click', () => {
            const cardElement = $container.children().first();
            if (cardElement.length) {
                const scrollAmount = cardElement.outerWidth() + 24;
                $container.stop().animate({ scrollLeft: "-=" + scrollAmount }, 400, 'swing', updateArrows);
            }
        });

        $scrollRightBtn.on('click', () => {
            const cardElement = $container.children().first();
            if (cardElement.length) {
                const scrollAmount = cardElement.outerWidth() + 24;
                $container.stop().animate({ scrollLeft: "+=" + scrollAmount }, 400, 'swing', updateArrows);
            }
        });

        updateArrows();
    }
});