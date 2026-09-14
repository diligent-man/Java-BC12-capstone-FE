import {API_URL} from "./config";

(function ($) {

    "use strict";

    var initPreloader = function () {
        var hidePreloader = function () {
            $('.preloader-wrapper').fadeOut();
            $('body').removeClass('preloader-site');
        };

        if (document.readyState === 'complete') { //Tự động kiểm tra nếu trang đã tải xong (document.readyState === 'complete') thì tắt màn hình loading ngay lập tức.
            hidePreloader();
        } else {
            $(window).on('load', hidePreloader);
            setTimeout(hidePreloader, 500);
        }
    }

    // background color when scroll
    var initScrollNav = function () {
        var scroll = $(window).scrollTop();

        if (scroll >= 200) {
            $('.navbar.fixed-top').addClass("bg-light");
        } else {
            $('.navbar.fixed-top').removeClass("bg-light");
        }
    }

    $(window).scroll(function () {
        initScrollNav();
    });


    // init Chocolat light box
    var initChocolat = function () {
        Chocolat(document.querySelectorAll('.image-link'), {
            imageSize: 'contain',
            loop: true,
        })
    }


    var initProductQty = function () {

        $('.product-qty').each(function () {

            var $el_product = $(this);
            var quantity = 0;

            $el_product.find('.quantity-right-plus').click(function (e) {
                e.preventDefault();
                var quantity = parseInt($el_product.find('#quantity').val());
                $el_product.find('#quantity').val(quantity + 1);
            });

            $el_product.find('.quantity-left-minus').click(function (e) {
                e.preventDefault();
                var quantity = parseInt($el_product.find('#quantity').val());
                if (quantity > 0) {
                    $el_product.find('#quantity').val(quantity - 1);
                }
            });

        });

    }

    window.updateCartBadge = function () {
        var cartString = localStorage.getItem('cart');
        var cart = cartString ? JSON.parse(cartString) : [];
        var count = cart.reduce(function (sum, item) {
            return sum + (item.quantity || 1);
        }, 0);
        $('.badge.rounded-circle.bg-primary').text(count.toString().padStart(2, '0'));
    };

    window.updateOffcanvasCart = function () {
        var cart = [];
        var cartString = localStorage.getItem('cart');
        if (cartString != null) {
            cart = JSON.parse(cartString);
        }

        var html = '';
        var totalPrice = 0;

        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var subtotal = item.price * item.quantity;
            totalPrice += subtotal;

            var imageSrc = `${API_URL}/file/product/${item.image}`;

            html += '<li class="list-group-item d-flex justify-content-between lh-sm">' +
                '  <div class="d-flex align-items-center">' +
                '    <img src="' + imageSrc + '" alt="' + item.name + '" ' +
                '         style="width:48px;height:48px;object-fit:cover;flex-shrink:0;background:#eee;border:1px solid #ddd;" ' +
                '         class="me-2 rounded">' +
                '    <div>' +
                '      <h6 class="my-0">' + item.name + '</h6>' +
                '      <small class="text-body-secondary">SL: ' + item.quantity + '</small>' +
                '    </div>' +
                '  </div>' +
                '  <span class="text-body-secondary">$' + subtotal.toFixed(2) + '</span>' +
                '</li>';
        }

        html += '<li class="list-group-item d-flex justify-content-between">' +
            '  <span class="fw-bold">Total (USD)</span>' +
            '  <strong>$' + totalPrice.toFixed(2) + '</strong>' +
            '</li>';

        $('#offcanvas-cart-items').html(html);
        $('#offcanvas-cart-count').text(cart.length);
    };

    window.addToCart = function (item) {
        var cartString = localStorage.getItem('cart');
        var cart = cartString ? JSON.parse(cartString) : [];

        var isExist = false;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].name === item.name) {
                cart[i].quantity += 1;
                isExist = true;
            }
        }
        if (isExist === false) {
            item.quantity = 1;
            cart.push(item);
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        updateCartBadge();
        updateOffcanvasCart();

        alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    };

    // document ready
    $(document).ready(function () {
        // product single page
        var thumb_slider = new Swiper(".product-thumbnail-slider", {
            loop: true,
            slidesPerView: 3,
            autoplay: true,
            direction: "vertical",
            spaceBetween: 30,
        });

        var large_slider = new Swiper(".product-large-slider", {
            loop: true,
            slidesPerView: 1,
            autoplay: true,
            effect: 'fade',
            thumbs: {
                swiper: thumb_slider,
            },
        });

        window.addEventListener("load", (event) => {

            var $grid = $('.entry-container').isotope({
                itemSelector: '.entry-item',
                layoutMode: 'masonry'
            });

        });

        initPreloader();
        initChocolat();
        initProductQty();

        updateCartBadge();
        updateOffcanvasCart();
    });
})(jQuery);
