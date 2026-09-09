$(document).ready(function () {
    var linkBE = "http://localhost:8081";
    var cart = [];

    // ===  ĐỌC GIỎ HÀNG TỪ LOCALSTORAGE ===
    var cartString = localStorage.getItem('cart');
    if (cartString != null) {
        cart = JSON.parse(cartString);
    }

    // ===  VẼ GIỎ HÀNG LẦN ĐẦU ===
    renderCart();

    $('#cart-items-container').on('click', '.quantity-right-plus', function () {
        var index = $(this).attr('data-id'); // Lấy vị trí phần tử
        cart[index].quantity += 1;              // Tăng số lượng trực tiếp
        saveAndRender();
    });
    // ===  SỰ KIỆN NÚT GIẢM SỐ LƯỢNG (-) ===
    $('#cart-items-container').on('click', '.quantity-left-minus', function () {
        var index = $(this).attr('data-id');
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;          // Giảm số lượng
            saveAndRender();
        }
    });
    // === SỰ KIỆN NÚT XÓA SẢN PHẨM ===
    $('#cart-items-container').on('click', '.btn-remove', function (e) {
        e.preventDefault();
        var index = $(this).attr('data-id');
        cart.splice(index, 1);                  // Xóa phần tử tại vị trí index khỏi mảng
        saveAndRender();
    });

    // === SỰ KIỆN NÚT CONTINUE SHOP (Quay lại trang shop) ===
    $('#btn-continue-shop').click(function (e) {
        e.preventDefault();
        window.location.href = 'shop.html';
    });

        // === GẮN SỰ KIỆN CHO CẢ 2 NÚT THANH TOÁN ===
    // Nút "Proceed to checkout" ở bảng Cart Total
    $('#btn-proceed-checkout').click(handleCheckout);
    // Nút "Continue to checkout" ở popup Your Cart bên phải
    $('#btn-continue-checkout').click(handleCheckout);


    // === HÀM LƯU VÀO LOCALSTORAGE VÀ VẼ LẠI ===
    function saveAndRender() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // === CẬP NHẬT OFFCANVAS CART KHI MỞ ===
    updateOffcanvasCart(); // Cập nhật lần đầu

    // HÀM UPDATE OFFCANVAS CART (GỌI KHI MỞ OFFCANVAS)
    function updateOffcanvasCart() {
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

            html += '<li class="list-group-item d-flex justify-content-between lh-sm">' +
                '  <div>' +
                '    <h6 class="my-0">' + item.name + '</h6>' +
                '    <small class="text-body-secondary">SL: ' + item.quantity + '</small>' +
                '  </div>' +
                '  <span class="text-body-secondary">$' + subtotal.toFixed(2) + '</span>' +
                '</li>';
        }

        // Thêm dòng Total
        html += '<li class="list-group-item d-flex justify-content-between">' +
            '  <span class="fw-bold">Total (USD)</span>' +
            '  <strong>$' + totalPrice.toFixed(2) + '</strong>' +
            '</li>';

        $('#offcanvas-cart-items').html(html);
        $('#offcanvas-cart-count').text(cart.length);
    }

    // === HÀM KIỂM TRA ĐĂNG NHẬP VÀ ĐIỀU HƯỚNG CHECKOUT ===
    function handleCheckout(e) {
        e.preventDefault();
        // Kiểm tra xem đã có token trong localStorage chưa
        var token = localStorage.getItem('token');
        if (!token) {
            // CHƯA ĐĂNG NHẬP:
            alert("Bạn cần đăng nhập trước khi thanh toán!");
            // Chuyển sang trang account.html, kèm tham số redirect=cart.html để login xong tự quay lại
            window.location.href = 'account.html?redirect=cart.html';
        } else {
            // ĐÃ ĐĂNG NHẬP: Cho phép sang trang checkout
            window.location.href = 'checkout.html';
        }
    }

    // === HÀM VẼ TOÀN BỘ GIỎ HÀNG ===
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
                imageSrc = linkBE + "/file/" + item.image;
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