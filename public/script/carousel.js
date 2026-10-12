function goToSlide(number) {
        const carouselElement = document.querySelector('#carouselExample');
        const carousel = new bootstrap.Carousel(carouselElement);
        carousel.to(number); // Membuka gambar sesuai urutan yang diklik
    }