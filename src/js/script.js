import {API_URL} from "./config";

(function ($) {
    "use strict";

    var initPreloader = function () {
        var hidePreloader = function () {
            $('.preloader-wrapper').fadeOut();
            $('body').removeClass('preloader-site');
        };

        if (document.readyState === 'complete') {
            //Tự động kiểm tra nếu trang đã tải xong (document.readyState === 'complete') thì tắt màn hình loading ngay lập tức.
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

    window.goToSingleProduct = function (el) {
        const item = JSON.parse(el.getAttribute('data-item'));
        window.location.href = `single-product.html?name=${encodeURIComponent(item.name)}`;
    };

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
            var variantLabel = [item.color, item.size].filter(Boolean).join(' / ');

            html += '<li class="list-group-item d-flex justify-content-between lh-sm">' +
                '  <div class="d-flex align-items-center">' +
                '    <img src="' + imageSrc + '" alt="' + item.name + '" ' +
                '         style="width:48px;height:48px;object-fit:cover;flex-shrink:0;background:#eee;border:1px solid #ddd;" ' +
                '         class="me-2 rounded">' +
                '    <div>' +
                '      <h6 class="my-0">' + item.name + (variantLabel ? ' (' + variantLabel + ')' : '') + '</h6>' +
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
        if (!item.quantity || item.quantity <= 0) {
            alert('Vui lòng chọn số lượng sản phẩm trước khi thêm vào giỏ hàng.');
            return;
        }
        var cartString = localStorage.getItem('cart');
        var cart = cartString ? JSON.parse(cartString) : [];

        var existing = cart.find(function (c) {
            return c.sku === item.sku;
        });

        var currentCartQty = existing ? (existing.quantity || 0) : 0;
        var newTotalQty = currentCartQty + item.quantity;

        if (item.maxQuantity != null && newTotalQty > item.maxQuantity) {
            var canAdd = item.maxQuantity - currentCartQty;

            if (canAdd <= 0) {
                alert(`Bạn đã có ${currentCartQty} sản phẩm này trong giỏ hàng, đã đạt số lượng tồn kho tối đa.`);
            } else {
                alert(`Chỉ còn ${item.maxQuantity} sản phẩm trong kho. Bạn chỉ có thể thêm tối đa ${canAdd} sản phẩm nữa.`);
            }
            return;
        }

        if (existing) {
            existing.quantity = newTotalQty;
            existing.maxQuantity = item.maxQuantity;
        } else {
            // delete itemToStore.maxQuantity;
            cart.push(Object.assign({}, item));
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        updateOffcanvasCart();
        alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    };

    window.productThumbSwiper = new Swiper(".product-thumbnail-slider", {
        loop: false,
        slidesPerView: 3,
        direction: "vertical",
        spaceBetween: 30,
        autoplay: true
    });

    window.productLargeSwiper = new Swiper(".product-large-slider", {
        loop: true,
        slidesPerView: 1,
        autoplay: true,
        effect: 'fade',
        fadeEffect: {crossFade: true},
        thumbs: {
            swiper: window.productThumbSwiper,
        },
    });

    // document ready
    $(document).ready(function () {
        window.addEventListener("load", (event) => {

            var $grid = $('.entry-container').isotope({
                itemSelector: '.entry-item',
                layoutMode: 'masonry'
            });

        });

        initPreloader();
        initChocolat();

        updateCartBadge();
        updateOffcanvasCart();
    });
})(jQuery);
