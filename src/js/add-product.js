import {API_URL} from './config.js';

$(document).ready(function () {
    let savedProductName = null;   // lưu productId sau khi tạo xong bước 1

    loadBrands();
    loadColors();
    loadSizes();
    loadChips('category', '#product-categories');
    loadChips('tag', '#product-tags');

    function resetStep2() {
        $('#variant-color, #variant-size, #variant-quantity, #variant-price').val('').removeClass('is-valid is-invalid');
        $('#variant-image-input').val('');
        $('#image-preview-list').empty();
        $('#image-error').hide();
    }

    // ─── Load Brand, Color, Size ────────────────────────────────────
    function loadBrands() {
        $.ajax({method: 'GET', url: `${API_URL}/brand`})
            .done(function (res) {
                var html = '<option value="">-- Select Brand --</option>';
                (res.data || []).forEach(function (b) {
                    html += `<option value="${b.name}">${b.name}</option>`;
                });
                $('#product-brand').html(html);
            })
            .fail(function () {
                showToast('Failed to load brands.', 'error');
            });
    }

    function loadColors() {
        $.ajax({method: 'GET', url: `${API_URL}/color`})
            .done(function (res) {
                var html = '<option value="">-- Select Color --</option>';
                (res.data || []).forEach(function (c) {
                    html += `<option value="${c.name}">${c.name}</option>`;
                });
                $('#variant-color').html(html);
            })
            .fail(function () {
                showToast('Failed to load colors.', 'error');
            });
    }

    function loadSizes() {
        $.ajax({method: 'GET', url: `${API_URL}/size`})
            .done(function (res) {
                var html = '<option value="">-- Select Size --</option>';
                (res.data || []).forEach(function (s) {
                    html += `<option value="${s.name}">${s.name}</option>`;
                });
                $('#variant-size').html(html);
            })
            .fail(function () {
                showToast('Failed to load sizes.', 'error');
            });
    }

    function loadChips(endpoint, container, prefix) {
        $.ajax({method: 'GET', url: `${API_URL}/${endpoint}`})
            .done(function (res) {
                var items = res.data || [];
                if (!items.length) {
                    $(container).html('<span class="text-muted">None available</span>');
                    return;
                }
                var html = items.map(function (item) {
                    var name = typeof item === 'string' ? item : item.name;
                    return `<label class="chip">
                            <input type="checkbox" value="${escapeHtml(name)}">
                            <span>${escapeHtml(name)}</span>
                        </label>`;
                }).join('');
                $(container).html(html);
            })
            .fail(function () {
                showToast(`Failed to load ${endpoint}.`, 'error');
            });
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, function (c) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
        });
    }

    function getCheckedValues(container) {
        return $(container).find('input:checked')
            .map(function () {
                return this.value;
            })
            .get();
    }

    // ─── Image preview ─────────────────────────────────────────────
    $('#variant-image-input').on('change', function () {
        var files = Array.from(this.files);
        var $box = $('#image-preview-box').empty();
        if (!files.length) return;

        files.forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $box.append(`<img src="${e.target.result}" alt="Preview"
                              style="width:100px;height:100px;object-fit:cover;margin:4px;border-radius:6px;">`);
            };
            reader.readAsDataURL(file);
        });

        $('#image-error').hide();
    });

    // ─── STEP 1: Submit product info ───────────────────────────────
    $('#form-product').on('submit', function (e) {
        e.preventDefault();

        var isValid = true;

        var name = $('#product-name').val().trim();
        if (!name) {
            $('#product-name').addClass('is-invalid');
            isValid = false;
        } else {
            $('#product-name').removeClass('is-invalid').addClass('is-valid');
        }

        var price = parseFloat($('#product-price').val());
        if (!price || price <= 0) {
            $('#product-price').addClass('is-invalid');
            isValid = false;
        } else {
            $('#product-price').removeClass('is-invalid').addClass('is-valid');
        }

        var brandName = $('#product-brand').val();
        if (brandName === '') {
            $('#product-brand').addClass('is-invalid');
            isValid = false;
        } else {
            $('#product-brand').removeClass('is-invalid').addClass('is-valid');
        }

        if (!isValid)
            return;

        $('#btn-step1').prop('disabled', true);
        $('#btn-step1-text').text('Saving...');
        $('#btn-step1-spinner').show();

        var token = localStorage.getItem('token');
        $.ajax({
            method: 'POST',
            url: `${API_URL}/product/insert`,
            headers: {'Authorization': 'Bearer ' + token},
            data: JSON.stringify({
                name: name,
                price: price,
                brandName: brandName,
                description: $('#product-description').val().trim(),
                information: $('#product-information').val().trim(),
                categoryNames: getCheckedValues('#product-categories'),
                tagNames: getCheckedValues('#product-tags')
            }),
            contentType: 'application/json',
        })
            .done(function (res) {
                savedProductName = res.data;
                showToast(`Product name (${savedProductName}) created!`, 'success');
                // goToStep2();
            })
            .fail(function (err) {
                var msg = err.responseJSON?.message || 'Failed to create product.';
                showToast(msg, 'error');
            })
            .always(function () {
                $('#btn-step1').prop('disabled', false);
                $('#btn-step1-text').text('Continue to Add Variant');
                $('#btn-step1-spinner').hide();
            });
    });

    // ─── Tab 2: Search product ─────────────────────────────────────

    let selectedProduct = null;   // product đã chọn để thêm variant
    let searchTimer = null;

    // Gọi GET /product/search?name=...
    $('#search-product').on('input', function () {
        var keyword = $(this).val().trim();
        clearTimeout(searchTimer);

        if (keyword.length < 2) {
            $('#search-dropdown').hide();
            return;
        }

        searchTimer = setTimeout(function () {
            $.ajax({
                    method: 'GET',
                    url: `${API_URL}/product/search?name=${encodeURIComponent(keyword)}`
                }
            )
                .done(function (res) {
                    var products = res.data || [];
                    if (products.length === 0) {
                        $('#search-dropdown').html('<div class="search-dropdown-item text-muted">No products found</div>').show();
                        return;
                    }
                    var html = '';
                    products.forEach(function (p) {
                        html += `<div class="search-dropdown-item" 
                                    data-id="${p.id}" 
                                    data-name="${p.name}" 
                                    data-brand-name="${p.brandName}" 
                                    data-price="${p.price}">
                                    <strong>${p.name}</strong>
                                    <span class="text-muted ms-2" style="font-size:0.85rem;">(price ${p.price}$, brand: ${p.brandName})</span>
                                </div>`;
                    });
                    $('#search-dropdown').html(html).show();
                });
        }, 1000);   // debounce 1000ms
    });

    // Khi chọn 1 product từ dropdown
    $(document).on('click', '.search-dropdown-item', function () {
        var id = $(this).data('id');
        var name = $(this).data('name');
        var price = $(this).data('price');
        var brandName = $(this).data('brand-name');

        if (!id)
            return;

        selectedProduct = {id, name, price, brandName};

        $('#search-product').val(name);
        $('#search-dropdown').hide();

        $('#selected-product-name').text(name);
        $('#selected-product-price').text(price);
        $('#selected-product-brand').text(brandName);
        $('#selected-product-info').show();
        $('#product-search-error').hide();
    });

    // Đóng dropdown khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#search-product, #search-dropdown').length) {
            $('#search-dropdown').hide();
        }
    });

    // ─── STEP 2: Submit variant ────────────────────────────────────
    $('#form-variant').on('submit', function (e) {
        e.preventDefault();

        var isValid = true;

        var colorName = $('#variant-color').val();
        if (colorName === '') {
            $('#variant-color').addClass('is-invalid');
            isValid = false;
        } else {
            $('#variant-color').removeClass('is-invalid').addClass('is-valid');
        }

        var sizeName = $('#variant-size').val();
        if (sizeName === '') {
            $('#variant-size').addClass('is-invalid');
            isValid = false;
        } else {
            $('#variant-size').removeClass('is-invalid').addClass('is-valid');
        }

        var quantity = parseInt($('#variant-quantity').val());
        if (!quantity || quantity < 1) {
            $('#variant-quantity').addClass('is-invalid');
            isValid = false;
        } else {
            $('#variant-quantity').removeClass('is-invalid').addClass('is-valid');
        }


        var price = $('#variant-price').val().trim();
        if (price === '') {
            price = selectedProduct.price;
            $('#variant-price').removeClass('is-invalid').addClass('is-valid');
        } else if (parseFloat(price) < 0.) {
            $('#variant-price').addClass('is-invalid');
            isValid = false;
        } else {
            price = parseFloat(price);
            $('#variant-price').removeClass('is-invalid').addClass('is-valid');
        }

        var imageFiles = $('#variant-image-input')[0].files;
        if (!imageFiles.length) {
            $('#image-error').show();
            isValid = false;
        } else {
            $('#image-error').hide();
        }

        if (!isValid) {
            return;
        }

        var formData = new FormData();
        formData.append('idProduct', selectedProduct.id);
        formData.append('colorName', colorName);
        formData.append('sizeName', sizeName);
        formData.append('quantity', quantity);
        formData.append('price', price);
        formData.append('brandName', selectedProduct.brandName);

        Array.from(imageFiles).forEach(function (file) {
            formData.append('files', file);
        });

        $('#btn-add-variant').prop('disabled', true);
        $('#btn-variant-text').text('Saving...');
        $('#btn-variant-spinner').show();

        const token = localStorage.getItem('token');
        $.ajax({
            method: 'POST',
            url: `${API_URL}/product/variant/insert`,
            headers: {'Authorization': 'Bearer ' + token},
            data: formData,
            processData: false,
            contentType: false,
        })
            .done(function () {
                showToast('Variant added successfully!', 'success');
                resetStep2();   // reset form để có thể thêm variant tiếp theo
            })
            .fail(function (err) {
                var msg = err.responseJSON?.message || 'Failed to add variant.';
                showToast(msg, 'error');
            })
            .always(function () {
                $('#btn-add-variant').prop('disabled', false);
                $('#btn-variant-text').text('Save Variant');
                $('#btn-variant-spinner').hide();
            });
    });


    // ─── Toast ─────────────────────────────────────────────────────

    function showToast(message, type) {
        var cls = type === 'success' ? 'toast-success' : 'toast-error';
        var icon = type === 'success' ? '✅' : '❌';
        var toast = $(`<div class="toast-msg ${cls}">${icon} ${message}</div>`);
        $('#toast-container').append(toast);
        setTimeout(function () {
            toast.fadeOut(400, function () {
                toast.remove();
            });
        }, 4000);
    }

    // ─── Live validation ────────────────────────────────────────────
    $('#product-name').on('input', function () {
        if ($(this).val().trim()) $(this).removeClass('is-invalid').addClass('is-valid');
    });
    $('#product-price').on('input', function () {
        if (parseFloat($(this).val()) > 0) $(this).removeClass('is-invalid').addClass('is-valid');
    });
    $('#product-brand').on('change', function () {
        if ($(this).val()) $(this).removeClass('is-invalid').addClass('is-valid');
    });

    $('#variant-color, #variant-size').on('change', function () {
        if ($(this).val()) $(this).removeClass('is-invalid').addClass('is-valid');
    });
    $('#variant-quantity').on('input', function () {
        if (parseInt($(this).val()) >= 1) $(this).removeClass('is-invalid').addClass('is-valid');
    });
    $('#variant-price').on('input', function () {
        if (parseFloat($(this).val()) >= 0.) $(this).removeClass('is-invalid').addClass('is-valid');
    });
});