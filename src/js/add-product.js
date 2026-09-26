import { API_URL } from './config.js';

$(document).ready(function () {

    let savedProductId = null;   // lưu productId sau khi tạo xong bước 1

    // ─── Load Brand, Color, Size ────────────────────────────────────

    function loadBrands() {
        $.ajax({ method: 'GET', url: `${API_URL}/brand` })
            .done(function (res) {
                var html = '<option value="">-- Select Brand --</option>';
                (res.data || []).forEach(function (b) {
                    html += `<option value="${b.id}">${b.name}</option>`;
                });
                $('#product-brand').html(html);
            })
            .fail(function () { showToast('Failed to load brands.', 'error'); });
    }

    function loadColors() {
        $.ajax({ method: 'GET', url: `${API_URL}/color` })
            .done(function (res) {
                var html = '<option value="">-- Select Color --</option>';
                (res.data || []).forEach(function (c) {
                    html += `<option value="${c.id}">${c.name}</option>`;
                });
                $('#variant-color').html(html);
            })
            .fail(function () { showToast('Failed to load colors.', 'error'); });
    }

    function loadSizes() {
        $.ajax({ method: 'GET', url: `${API_URL}/size` })
            .done(function (res) {
                var html = '<option value="">-- Select Size --</option>';
                (res.data || []).forEach(function (s) {
                    html += `<option value="${s.id}">${s.name}</option>`;
                });
                $('#variant-size').html(html);
            })
            .fail(function () { showToast('Failed to load sizes.', 'error'); });
    }

    loadBrands();
    loadColors();
    loadSizes();

    // ─── Image preview ─────────────────────────────────────────────

    $('#variant-image-input').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#image-preview-box').html(`<img src="${e.target.result}" alt="Preview">`);
        };
        reader.readAsDataURL(file);
        $('#image-error').hide();
    });

    // ─── STEP 1: Submit product info ───────────────────────────────

    $('#form-product').on('submit', function (e) {
        e.preventDefault();

        var isValid = true;

        var name = $('#product-name').val().trim();
        if (!name) { $('#product-name').addClass('is-invalid'); isValid = false; }
        else        { $('#product-name').removeClass('is-invalid').addClass('is-valid'); }

        var price = parseFloat($('#product-price').val());
        if (!price || price <= 0) { $('#product-price').addClass('is-invalid'); isValid = false; }
        else                      { $('#product-price').removeClass('is-invalid').addClass('is-valid'); }

        var idBrand = $('#product-brand').val();
        if (!idBrand) { $('#product-brand').addClass('is-invalid'); isValid = false; }
        else          { $('#product-brand').removeClass('is-invalid').addClass('is-valid'); }

        if (!isValid) return;

        var formData = new FormData();
        formData.append('name',        name);
        formData.append('price',       price);
        formData.append('idBrand',     idBrand);
        formData.append('description', $('#product-description').val().trim());
        formData.append('information', $('#product-information').val().trim());

        $('#btn-step1').prop('disabled', true);
        $('#btn-step1-text').text('Saving...');
        $('#btn-step1-spinner').show();

        $.ajax({
            method: 'POST',
            url: `${API_URL}/product/insert`,
            data: JSON.stringify({
                name:        name,
                price:       price,
                idBrand:     parseInt(idBrand),
                description: $('#product-description').val().trim(),
                information: $('#product-information').val().trim()
            }),
            contentType: 'application/json',   // gửi JSON, không phải multipart
        })
        .done(function (res) {
            savedProductId = res.data;   // productId trả về từ BE
            showToast(`Product created! ID: ${savedProductId}`, 'success');
            goToStep2();
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
            $.ajax({ method: 'GET', url: `${API_URL}/product/search?name=${encodeURIComponent(keyword)}` })
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
                                    data-price="${p.price}">
                                    <strong>${p.name}</strong>
                                    <span class="text-muted ms-2" style="font-size:0.85rem;">ID: ${p.id} · $${p.price}</span>
                                </div>`;
                    });
                    $('#search-dropdown').html(html).show();
                });
        }, 300);   // debounce 300ms
    });

    // Khi chọn 1 product từ dropdown
    $(document).on('click', '.search-dropdown-item', function () {
        var id    = $(this).data('id');
        var name  = $(this).data('name');
        var price = $(this).data('price');

        if (!id) return;   // "No products found" row

        selectedProduct = { id, name, price };

        $('#search-product').val(name);
        $('#search-dropdown').hide();

        $('#selected-product-name').text(name);
        $('#selected-product-id').text(id);
        $('#selected-product-price').text(price);
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

        var idColor = $('#variant-color').val();
        if (!idColor) { $('#variant-color').addClass('is-invalid'); isValid = false; }
        else          { $('#variant-color').removeClass('is-invalid').addClass('is-valid'); }

        var idSize = $('#variant-size').val();
        if (!idSize) { $('#variant-size').addClass('is-invalid'); isValid = false; }
        else         { $('#variant-size').removeClass('is-invalid').addClass('is-valid'); }

        var quantity = parseInt($('#variant-quantity').val());
        if (!quantity || quantity < 1) { $('#variant-quantity').addClass('is-invalid'); isValid = false; }
        else                           { $('#variant-quantity').removeClass('is-invalid').addClass('is-valid'); }

        var imageFile = $('#variant-image-input')[0].files[0];
        if (!imageFile) { $('#image-error').show(); isValid = false; }
        else            { $('#image-error').hide(); }

        if (!isValid) return;

        var formData = new FormData();
        formData.append('idProduct', selectedProduct.id);
        formData.append('idColor',   idColor);
        formData.append('idSize',    idSize);
        formData.append('quantity',  quantity);
        formData.append('file',      imageFile);

        $('#btn-add-variant').prop('disabled', true);
        $('#btn-variant-text').text('Saving...');
        $('#btn-variant-spinner').show();

        $.ajax({
            method: 'POST',
            url: `${API_URL}/product/variant/insert`,
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
            toast.fadeOut(400, function () { toast.remove(); });
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

});