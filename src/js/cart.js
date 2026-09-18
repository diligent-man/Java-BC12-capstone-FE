import {API_URL} from './config';

$(document).ready(function () {
    var cart = [];
    var currentVariant = null;

    var cartString = localStorage.getItem('cart');
    if (cartString != null) {
        cart = JSON.parse(cartString);
    }

    renderCart();

    $(document).on('click', '.quantity-right-plus', function () {
        var index = $(this).attr('data-id');
        var currentVariant = cart[index];

        if (!currentVariant)
            return;

        var input = currentVariant.quantity;

        var current = parseInt(input, 10);
        if (isNaN(current)) current = 0;

        var max = currentVariant.quantity || 0;

        if (current < max) {
            cart[index].quantity += 1;
        }
        renderCart();
    });

    $(document).on('click', '.quantity-left-minus', function () {
        var index = $(this).attr('data-id');
        var currentVariant = cart[index];

        if (!currentVariant)
            return;

        var current = parseInt(currentVariant.quantity, 10);
        if (isNaN(current)) current = 0;

        var max = currentVariant.quantity || 0;

        if (current < max) {
            cart[index].quantity += 1;
        }
        renderCart();
    });

    // === SỰ KIỆN NÚT XÓA SẢN PHẨM ===
    $('#cart-items-container').on('click', '.btn-remove', function (e) {
        e.preventDefault();
        var index = $(this).attr('data-id');
        cart.splice(index, 1);
        saveAndRender();
    });

    // === SỰ KIỆN NÚT CONTINUE SHOP (Quay lại trang shop) ===
    $('#btn-continue-shop').click(function (e) {
        e.preventDefault();
        window.location.href = 'shop.html';
    });

    // === GẮN SỰ KIỆN CHO CẢ 2 NÚT THANH TOÁN ===
    $('#btn-proceed-checkout').click(handleCheckout);
    $('#btn-continue-checkout').click(handleCheckout);

    // === HÀM LƯU VÀO LOCALSTORAGE VÀ VẼ LẠI ===
    function saveAndRender() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();

        // Keep nav badge + offcanvas cart drawer in sync with this page's cart table
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
        if (typeof window.updateOffcanvasCart === 'function') {
            window.updateOffcanvasCart();
        }
    }

    // === HÀM KIỂM TRA ĐĂNG NHẬP VÀ ĐIỀU HƯỚNG CHECKOUT ===
    function handleCheckout(e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Giỏ hàng của bạn đang trống!");
            return;
        }

        var token = localStorage.getItem('token');
        if (!token) {
            alert("Bạn cần đăng nhập trước khi thanh toán!");
            window.location.href = 'account.html?redirect=cart.html';
            return;
        }

        $.ajax({
            url: API_URL + '/auth/check-session',
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .done(function () {
                window.location.href = 'checkout.html';
            })
            .fail(function (xhr) {
                if (xhr.status === 401) {
                    localStorage.removeItem('token');
                    alert("Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại!");
                    window.location.href = 'account.html?redirect=cart.html';
                } else {
                    alert("Có lỗi xảy ra, vui lòng thử lại!");
                }
            });
    }

    // === HÀM VẼ TOÀN BỘ GIỎ HÀNG ===
    function renderCart() {
        var html = '';
        var totalPrice = 0;

        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var subtotal = item.price * item.quantity;
            totalPrice += subtotal;

            var imageSrc = `${API_URL}/file/product/${item.image}`;
            var variantLabel = [item.color, item.size].filter(Boolean).join(' / ');

            html += '<tr>' +
                '<td scope="row" class="py-4">' +
                '  <div class="cart-info d-flex flex-wrap align-items-center">' +
                '    <div class="col-lg-3">' +
                '      <div class="card-image">' +
                '        <img src="' + imageSrc + '" alt="' + item.name + '" class="img-fluid">' +
                '      </div>' +
                '    </div>' +
                '    <div class="col-lg-9">' +
                '      <div class="card-detail ps-3">' +
                '        <h5 class="card-title">' +
                '          <a href="#" class="text-decoration-none">' + item.name + '</a>' +
                '        </h5>' +
                (variantLabel ? '        <p class="text-muted mb-0 small">' + variantLabel + '</p>' : '') +
                '        <p class="text-muted mb-0">Đơn giá: $' + item.price + '</p>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</td>' +
                '<td class="py-4 align-middle">' +
                '  <div class="input-group product-qty align-items-center" style="width: 120px;">' +
                '    <span class="input-group-btn">' +
                '      <button type="button" class="quantity-left-minus p-1 btn btn-light btn-number" data-id="' + i + '">' +
                '        <svg width="16" height="16"><use xlink:href="#minus"></use></svg>' +
                '      </button>' +
                '    </span>' +
                '    <input type="text" class="form-control input-number text-center p-2 mx-1" value="' + item.quantity + '" readonly>' +
                '    <span class="input-group-btn">' +
                '      <button type="button" class="quantity-right-plus p-1 btn btn-light btn-number" data-id="' + i + '">' +
                '        <svg width="16" height="16"><use xlink:href="#plus"></use></svg>' +
                '      </button>' +
                '    </span>' +
                '  </div>' +
                '</td>' +
                '<td class="py-4 align-middle">' +
                '  <div class="total-price">' +
                '    <span class="secondary-font fw-medium">$' + subtotal.toFixed(2) + '</span>' +
                '  </div>' +
                '</td>' +
                '<td class="py-4 align-middle">' +
                '  <div class="cart-remove">' +
                '    <a href="#" class="btn-remove" data-id="' + i + '">' +
                '      <svg width="24" height="24"><use xlink:href="#trash"></use></svg>' +
                '    </a>' +
                '  </div>' +
                '</td>' +
                '</tr>';
        }

        if (cart.length === 0) {
            html = '<tr><td colspan="4" class="text-center py-5">Giỏ hàng của bạn đang trống!</td></tr>';
        }

        $('#cart-items-container').html(html);

        $('#cart-subtotal').text(totalPrice.toFixed(2));
        $('#cart-total').text(totalPrice.toFixed(2));
    }
});
