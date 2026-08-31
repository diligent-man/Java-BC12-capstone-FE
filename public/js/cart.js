$(document).ready(function () {
    var linkBE = "http://localhost:8080";
    var cart = [];

    // === 1. ĐỌC GIỎ HÀNG TỪ LOCALSTORAGE ===
    var cartString = localStorage.getItem('cart');
    if (cartString != null) {
        cart = JSON.parse(cartString);
    }

    // === 2. VẼ GIỎ HÀNG LẦN ĐẦU ===
    renderCart();

    // === 3. SỰ KIỆN NÚT TĂNG SỐ LƯỢNG (+) ===
    $('#cart-items-container').on('click', '.quantity-right-plus', function () {
        var productId = $(this).attr('data-id');
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id == productId) {
                cart[i].quantity += 1;
                break;
            }
        }
        saveAndRender();
    });

    // === 4. SỰ KIỆN NÚT GIẢM SỐ LƯỢNG (-) ===
    $('#cart-items-container').on('click', '.quantity-left-minus', function () {
        var productId = $(this).attr('data-id');
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id == productId) {
                if (cart[i].quantity > 1) {
                    cart[i].quantity -= 1;
                }
                break;
            }
        }
        saveAndRender();
    });

    // === 5. SỰ KIỆN NÚT XÓA SẢN PHẨM (thùng rác) ===
    $('#cart-items-container').on('click', '.btn-remove', function (e) {
        e.preventDefault();
        var productId = $(this).attr('data-id');
        cart = cart.filter(function (item) {
            return item.id != productId;
        });
        saveAndRender();
    });

    // === 6. HÀM LƯU VÀO LOCALSTORAGE VÀ VẼ LẠI ===
    function saveAndRender() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // === 7. HÀM VẼ TOÀN BỘ GIỎ HÀNG ===
    function renderCart() {
        var html = '';
        var totalPrice = 0;

        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            var subtotal = item.price * item.quantity;
            totalPrice += subtotal;

            // Kiểm tra hình ảnh null
            var imageSrc = "/images/no-image.png";
            if (item.image != null && item.image.length > 0) {
                imageSrc = linkBE + "/file/" + item.image[0];
            }

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
                '        <p class="text-muted mb-0">Đơn giá: $' + item.price + '</p>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</td>' +
                '<td class="py-4 align-middle">' +
                '  <div class="input-group product-qty align-items-center w-50">' +
                '    <span class="input-group-btn">' +
                '      <button type="button" class="quantity-left-minus p-1 btn btn-light btn-number" data-id="' + item.id + '">' +
                '        <svg width="16" height="16"><use xlink:href="#minus"></use></svg>' +
                '      </button>' +
                '    </span>' +
                '    <input type="text" class="form-control input-number text-center p-2 mx-1" value="' + item.quantity + '" readonly>' +
                '    <span class="input-group-btn">' +
                '      <button type="button" class="quantity-right-plus p-1 btn btn-light btn-number" data-id="' + item.id + '">' +
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
                '    <a href="#" class="btn-remove" data-id="' + item.id + '">' +
                '      <svg width="24" height="24"><use xlink:href="#trash"></use></svg>' +
                '    </a>' +
                '  </div>' +
                '</td>' +
                '</tr>';
        }

        // Nếu giỏ hàng trống
        if (cart.length === 0) {
            html = '<tr><td colspan="4" class="text-center py-5">Giỏ hàng của bạn đang trống!</td></tr>';
        }

        // Đổ HTML vào bảng
        $('#cart-items-container').html(html);

        // Cập nhật Subtotal và Total
        $('#cart-subtotal').text(totalPrice.toFixed(2));
        $('#cart-total').text(totalPrice.toFixed(2));
    }
});