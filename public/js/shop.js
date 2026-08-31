$(document).ready(function () {
    var linkBE = "http://localhost:8080";
    var pageSize = 9;       // Shop hiển thị 9 sản phẩm / trang (3 hàng x 3 cột)
    var currentPage = 0;    // Trang hiện tại (BE bắt đầu từ 0)
    var totalPages = 0;     // Tổng số trang (lấy từ API trả về)
    var cart = [];
    var searchKeyword = "";
    var cartString = localStorage.getItem('cart');
    if (cartString != null) {
        cart = JSON.parse(cartString);
    }


        // === SỰ KIỆN TÌM KIẾM (Nhấn Enter hoặc Click kính lúp) ===
    
    // 1. Khi nhấn phím Enter trong ô input
    $('#search-input').on('keypress', function (e) {
        if (e.which === 13) { // 13 là mã của phím Enter
            e.preventDefault(); 
            searchKeyword = $(this).val().trim();
            currentPage = 0; 
            getShopProduct(currentPage);
        }
    });
        // === SỰ KIỆN TÌM KIẾM TRONG POPUP (Nhấn Enter) ===
    $('#modal-search-input').on('keypress', function (e) {
        if (e.which === 13) { // 13 là phím Enter
            e.preventDefault(); 
            searchKeyword = $(this).val().trim(); // Lấy từ khóa ở ô popup
            currentPage = 0; 
            getShopProduct(currentPage);
            
            // Lệnh này giúp tự động đóng cái popup lại sau khi search xong cho đẹp
            $('.offcanvas').offcanvas('hide'); 
        }
    });
    // 2. (Tùy chọn) Khi click chuột vào cái hình kính lúp SVG
    $('#search-form svg').css('cursor', 'pointer').on('click', function() {
        searchKeyword = $('#search-input').val().trim();
        currentPage = 0;
        getShopProduct(currentPage);
    });

    // === SỰ KIỆN CLICK NÚT ADD TO CART Ở TRANG SHOP ===
    $('#shop-product-container').on('click', '.btn-cart', function () {
        var strJsonItem = $(this).attr("data");
        var item = JSON.parse(strJsonItem);
        var isExist = false;
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == item.id) {
                cart[i].quantity += 1;
                isExist = true;
            }
        }
        
        // Nếu chưa có thì thêm mới
        if (isExist == false) {
            item.quantity = 1;
            cart.push(item);
        }
        // Lưu lại vào localStorage
        localStorage.setItem("cart", JSON.stringify(cart));
        updateOffcanvasCart(); // ← THÊM DÒNG NÀY
        console.log("Đã thêm vào giỏ: ", item);
        alert("Đã thêm sản phẩm vào giỏ hàng thành công!"); // Bạn có thể dùng thư viện toast hoặc alert
    });

    // Tải trang đầu tiên khi mở shop
    getShopProduct(currentPage);

    // === SỰ KIỆN NÚT TRANG TRƯỚC ===
    $('#btn-prev-page').click(function (e) {
        e.preventDefault();
        if (currentPage > 0) {
            currentPage--;
            getShopProduct(currentPage);
        }
    });

    // === SỰ KIỆN NÚT TRANG SAU ===
    $('#btn-next-page').click(function (e) {
        e.preventDefault();
        if (currentPage < totalPages - 1) {
            currentPage++;
            getShopProduct(currentPage);
        }
    });

    // === SỰ KIỆN CLICK SỐ TRANG (dùng delegation vì số trang được tạo động) ===
    $('#page-numbers-container').on('click', '.page-number-btn', function (e) {
        e.preventDefault();
        currentPage = parseInt($(this).attr('data-page'));
        getShopProduct(currentPage);
    });

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


    // === HÀM CHÍNH: GỌI API VÀ HIỂN THỊ SẢN PHẨM ===
    function getShopProduct(page) {
    // Xác định URL: nếu có từ khóa thì gọi API search, không thì gọi API paging
        var url = "";
        if (searchKeyword !== "") {
            url = `${linkBE}/product/search?keyword=${searchKeyword}&pageNumber=${page}&pageSize=${pageSize}`;
        } else {
            url = `${linkBE}/product/paging?pageNumber=${page}&pageSize=${pageSize}`;
        }

        $.ajax({
            method: "GET",
            url: url
        })
        .done(function (result) {
            var data = result.data.content;
            totalPages = result.data.totalPages;     // Lấy tổng số trang từ API
            var totalElements = result.data.totalElements; // Tổng số sản phẩm

            // --- Cập nhật dòng "Showing X-Y of Z results" ---
            var from = page * pageSize + 1;
            var to = Math.min(from + data.length - 1, totalElements);
            $('#showing-result').text(`Showing ${from}–${to} of ${totalElements} results`);

            // --- Vẽ sản phẩm ---
            $('#shop-product-container').html(''); // Xóa sản phẩm cũ
            var html = '';
            for (let i = 0; i < data.length; i++) {
                var item = data[i];
                var stringJSON = JSON.stringify(item);
                html += `<div class="col-md-6 col-lg-4 my-4">
                            <div class="product-item">
                                <div class="image-holder" style="width:100%;height:100%;">
                                    <img src="${linkBE}/file/${item.image[0]}" alt="${item.name}" class="product-image img-fluid">
                                </div>
                                <div class="cart-concern">
                                    <div class="cart-button d-flex justify-content-between align-items-center">
                                        <span class="btn-cart btn-wrap cart-link d-flex align-items-center text-capitalize fs-6" data='${stringJSON}'>
                                            add to cart <i class="icon icon-arrow-io pe-1"></i>
                                        </span>
                                        <a href="single-product.html" class="view-btn">
                                            <i class="icon icon-screen-full"></i>
                                        </a>
                                        <a href="#" class="wishlist-btn">
                                            <i class="icon icon-heart"></i>
                                        </a>
                                    </div>
                                </div>
                                <div class="product-detail d-flex justify-content-between align-items-center mt-4">
                                    <h4 class="product-title mb-0">
                                        <a href="single-product.html">${item.name}</a>
                                    </h4>
                                    <p class="m-0 fs-5 fw-normal">$${item.price}</p>
                                </div>
                            </div>
                         </div>`;
            }
            $('#shop-product-container').html(html);

            // --- Vẽ số trang ---
            renderPageNumbers(totalPages, page);
        });
    }

    // === HÀM VẼ SỐ TRANG ĐỘNG ===
    function renderPageNumbers(total, active) {
        var html = '';
        for (let i = 0; i < total; i++) {
            if (i === active) {
                // Trang đang active thì dùng <span> thay vì <a>
                html += `<span class="page-numbers mt-2 fs-3 mx-3 current">${i + 1}</span>`;
            } else {
                html += `<a href="#" class="page-numbers page-number-btn mt-2 fs-3 mx-3" data-page="${i}">${i + 1}</a>`;
            }
        }
        $('#page-numbers-container').html(html);
    }
});