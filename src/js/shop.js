import {API_URL} from './config';

$(document).ready(function () {
    var pageSize = 10;
    var currentPage = 0;
    var totalPages = 0;
    var cart = [];
    var searchName = "";
    var cartString = localStorage.getItem('cart');

    if (cartString != null) {
        cart = JSON.parse(cartString);
    }

    const filters = {
        categories: [],
        tags: [],
        brands: [],
        priceRanges: [],
        sort: ""
    };


    $(document).on('change', '.brand-checkbox', function () {
        filters.brands = $('#brand-list .brand-checkbox:checked').map(function () {
            return $(this).val();
        }).get();
        getShopProduct(0);
    });

    $(document).on('change', '.tag-checkbox', function () {
        filters.tags = $('#tag-list .tag-checkbox:checked').map(function () {
            return $(this).val();
        }).get();
        getShopProduct(0);
    });

    $(document).on('change', '.category-checkbox', function () {
        filters.categories = $('#category-list .category-checkbox:checked').map(function () {
            return $(this).val();
        }).get();
        getShopProduct(0);
    });

    $(document).on('change', '.price-checkbox', function () {
        filters.priceRanges = $('#price-list .price-checkbox:checked').map(function () {
            return {
                min: parseFloat($(this).data('min')),
                max: $(this).data('max') === '' ? null : parseFloat($(this).data('max'))
            };
        }).get();
        getShopProduct(0);
    });

    $(document).on('change', '#sort-select', function () {
        filters.sort = $(this).val();
        getShopProduct(0);
    });

    // === SỰ KIỆN TÌM KIẾM (Nhấn Enter hoặc Click kính lúp) ===
    // 1. Khi nhấn phím Enter trong ô input
    $('#search-input').on('keypress', function (e) {
        if (e.which === 13) { // 13 là mã của phím Enter
            e.preventDefault();
            searchName = $(this).val().trim();
            currentPage = 0;
            getShopProduct(currentPage);
        }
    });

    // === SỰ KIỆN TÌM KIẾM TRONG POPUP (Nhấn Enter) ===
    $('#modal-search-input').on('keypress', function (e) {
        if (e.which === 13) { // 13 là phím Enter
            e.preventDefault();
            searchName = $(this).val().trim(); // Lấy từ khóa ở ô popup
            currentPage = 0;
            getShopProduct(currentPage);

            // Lệnh này giúp tự động đóng cái popup lại sau khi search xong cho đẹp
            $('.offcanvas').offcanvas('hide');
        }
    });
    // 2. (Tùy chọn) Khi click chuột vào cái hình kính lúp SVG
    $('#search-form svg').css('cursor', 'pointer').on('click', function () {
        searchName = $('#search-input').val().trim();
        currentPage = 0;
        getShopProduct(currentPage);
    });

    // === SỰ KIỆN CLICK NÚT ADD TO CART Ở TRANG SHOP ===
    $('#shop-product-container').on('click', '.btn-cart', function () {
        var item = JSON.parse($(this).attr("data-item"));
        addToCart(item);
    });


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

    getShopProduct(currentPage);
    updateOffcanvasCart();

    function buildPriceRangeParams(priceRanges) {
        var params = new URLSearchParams();
        priceRanges.forEach(function (range, index) {
            params.append(`priceRanges[${index}].minPrice`, range.min);
            if (range.max !== null) {
                params.append(`priceRanges[${index}].maxPrice`, range.max);
            }
        });
        return params.toString();
    }

    function getCategory() {
        $.ajax({
            method: "GET",
            url: `${API_URL}/category`
        })
            .done(function (result) {
                var data = result.data;
                var html = '';

                for (let i = 0; i < data.length; i++) {
                    const category = data[i];
                    html += `<li class="category-item">
                            <label class="fw-semibold">
                                <input type="checkbox" class="category-checkbox" value="${category.name}">
                                ${category.name}
                            </label>
                        </li>`;
                }

                $('#category-list').html(html);
            })
            .fail(function (err) {
                console.error("Failed to load categories:", err);
            });
    }

    function getTag() {
        $.ajax({
            method: "GET",
            url: `${API_URL}/tag`
        })
            .done(function (result) {
                var data = result.data;
                var html = '';

                for (let i = 0; i < data.length; i++) {
                    const tag = data[i];
                    html += `<li class="tags-item">
                            <label class="fw-semibold">
                                <input type="checkbox" class="tag-checkbox" value="${tag.name}">
                                ${tag.name}
                            </label>
                        </li>`;
                }

                $('#tag-list').html(html);
            })
            .fail(function (err) {
                console.error("Failed to load tags:", err);
            });
    }

    function getBrand() {
        $.ajax({
            method: "GET",
            url: `${API_URL}/brand`
        })
            .done(function (result) {
                var data = result.data;
                var html = '';

                for (let i = 0; i < data.length; i++) {
                    const brand = data[i];
                    html += `<li class="tags-item">
                            <label class="fw-semibold">
                                <input type="checkbox" class="brand-checkbox" value="${brand.name}">
                                ${brand.name}
                            </label>
                        </li>`;
                }

                $('#brand-list').html(html);
            })
            .fail(function (err) {
                console.error("Failed to load brands:", err);
            });
    }

    // === HÀM CHÍNH: GỌI API VÀ HIỂN THỊ SẢN PHẨM ===
    function getShopProduct(pageNumber) {
        var params = {
            page: pageNumber,
            size: pageSize
        };

        if (filters.sort !== "") params.sort = filters.sort;
        if (searchName !== "") params.name = searchName;
        if (filters.categories.length) params.categories = filters.categories.join(',');
        if (filters.tags.length) params.tags = filters.tags.join(',');
        if (filters.brands.length) params.brands = filters.brands.join(',');

        var url = `${API_URL}/product/filter?` + $.param(params);

        if (filters.priceRanges.length) {
            url += '&' + buildPriceRangeParams(filters.priceRanges);
        }

        $.ajax({
            method: "GET",
            url: url
        })
            .done(function (result) {
                var data = result.data.content;
                totalPages = result.data.totalPages;
                var totalElements = result.data.totalElements;

                // --- Cập nhật dòng "Showing X-Y of Z results" ---
                var from = pageNumber * pageSize + 1;
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
                                    <img src="${API_URL}/file/product/${item.image}" alt="${item.name}" class="product-image img-fluid">
                                </div>
                                <div class="cart-concern">
                                    <div class="cart-button d-flex justify-content-between align-items-center">
                                        <span class="btn-cart btn-wrap cart-link d-flex align-items-center text-capitalize fs-6" data-item='${stringJSON}'>
                                            add to cart <i class="icon icon-arrow-io pe-1"></i>
                                        </span>
                                        <a href="single-product.html?name=${encodeURIComponent(item.name)}" class="view-btn">
                                            <i class="icon icon-screen-full"></i>
                                        </a>
                                        <a href="#" class="wishlist-btn">
                                            <i class="icon icon-heart"></i>
                                        </a>
                                    </div>
                                </div>
                                <div class="product-detail d-flex justify-content-between align-items-center mt-4">
                                    <h4 class="product-title mb-0">
                                        <a href="single-product.html?name=${encodeURIComponent(item.name)}">${item.name}</a>
                                    </h4>
                                    <p class="m-0 fs-5 fw-normal">$${item.price}</p>
                                </div>
                            </div>
                         </div>`;
                }
                $('#shop-product-container').html(html);

                // --- Vẽ số trang ---
                renderPageNumbers(totalPages, pageNumber);
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


    $(document).ready(function () {
        getCategory();
        getTag();
        getBrand();
    });
});