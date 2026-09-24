import {API_URL} from './config';

$(document).ready(function () {
    var totalPrice = 0;
    var cart = [];
    var cartString = localStorage.getItem('cart');
    if (cartString) {
        cart = JSON.parse(cartString);
    }

    // Nếu giỏ hàng trống → chuyển về trang Cart
    if (cart.length === 0) {
        alert('Giỏ hàng trống! Vui lòng thêm sản phẩm trước.');
        window.location.href = 'cart.html';
        return;
    }

    computeCartTotalPrice();
    loadPaymentMethods();
    loadCountries();

    $('#checkout-subtotal').text('$' + totalPrice.toFixed(2));
    $('#checkout-total').text('$' + totalPrice.toFixed(2));

    // === 3. XỬ LÝ NÚT "PLACE AN ORDER" ===
    $('#btn-place-order').click(function (e) {
        e.preventDefault(); // Ngăn form submit mặc định (reload trang)

        // 3a. Lấy token xác thực
        var token = localStorage.getItem('token');
        if (!token) {
            alert('Phiên đăng nhập đã hết, vui lòng đăng nhập lại!');
            window.location.href = 'account.html?redirect=checkout.html';
            return;
        }

        // 3b. Thu thập dữ liệu từ form
        var firstName = $('#fname').val().trim();
        var lastName = $('#lname').val().trim();
        var companyName = $('#cname').val().trim();
        var countryIso = $('#country-select').val();
        var address = $('#adr').val().trim();
        var town = $('#city').val().trim();
        var state = $('#state-input').val().trim();
        var zipCode = $('#zip').val().trim();
        var phone = $('#phone').val().trim();
        var email = $('#email').val().trim();

        // 3c. Kiểm tra các trường bắt buộc
        if (!firstName || !lastName || !address || !town || !state || !zipCode || !phone || !email) {
            alert('Vui lòng điền đầy đủ thông tin thanh toán!');
            return;
        }

        // 3d. Xây dựng danh sách sản phẩm từ giỏ hàng
        //     Mỗi item cần: skuVariant (số), quantity, price
        var items = [];
        for (var i = 0; i < cart.length; i++) {
            items.push({
                sku: cart[i].sku,
                quantity: cart[i].quantity,
                price: cart[i].price
            });
        }

        var paymentMethodName = $('input[name="listGroupRadios"]:checked').val();
        if (!paymentMethodName) {
            alert('Vui lòng chọn phương thức thanh toán!');
            return;
        }

        var requestBody = {
            billing: {
                firstName: firstName,
                lastName: lastName,
                companyName: companyName || 'N/A',
                countryIso: countryIso,
                address: address,
                town: town,
                state: state,
                zipCode: zipCode,
                phone: phone,
                email: email
            },
            items: items,
            paymentMethodName: paymentMethodName,
            totalAmount: totalPrice
        };

        // 3f. Disable nút để tránh bấm 2 lần
        var $btn = $(this);
        $btn.prop('disabled', true).text('Đang xử lý...');

        // 3g. Gọi API checkout
        $.ajax({
            url: `${API_URL}/api/order/checkout`,
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: JSON.stringify(requestBody)
        })
            .done(function (result) {
                console.log('Checkout thành công:', result);
                var data = result.data;

                if (data !== null) {
                    showQrModal(data.orderId, data.qrUrl, data.amount, data.transferContent);
                } else {
                    handleFail();
                }
            })
            .fail(function (xhr) {
                console.error('Checkout thất bại:', xhr);
                handleFail(xhr);
            })
            .always(function () {
                $btn.prop('disabled', false).text('Place an order');
            });
    });

    function computeCartTotalPrice() {
        for (var i = 0; i < cart.length; i++) {
            totalPrice += cart[i].price * cart[i].quantity;
        }
    }

    async function loadCountries(defaultIso = 'VN') {
        const select = document.getElementById('country-select');
        select.innerHTML = '';

        var token = localStorage.getItem('token');

        if (!token) {
            console.error('No token found, cannot load countries');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/country`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!res.ok)
                console.error(new Error(`HTTP ${res.status}`));

            const resp = await res.json();
            const data = resp.data;
            data.forEach(ele => {
                const option = document.createElement('option');
                option.value = ele.iso;
                option.textContent = ele.name;
                select.appendChild(option);
            });

            select.value = defaultIso;
        } catch (err) {
            console.error('Failed to load countries:', err);
        }
    }

    function loadPaymentMethods() {
        var token = localStorage.getItem('token');

        $.ajax({
            url: `${API_URL}/api/payment/methods`,
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .done(function (result) {
                var methods = result.data || [];
                renderPaymentMethods(methods);
            })
            .fail(function (xhr) {
                console.error('Load payment methods thất bại:', xhr);
                $('#payment-method-list').html(
                    '<p class="text-danger">Không thể tải phương thức thanh toán. Vui lòng thử lại.</p>'
                );
            });
    }

    function renderPaymentMethods(methods) {
        var $container = $('#payment-method-list');
        $container.empty();

        if (methods.length === 0) {
            $container.html('<p class="text-body-secondary">Không có phương thức thanh toán khả dụng.</p>');
            return;
        }

        methods.forEach(function (method, index) {
            var isChecked = index === 0 ? 'checked' : '';
            var inputId = 'listGroupRadios' + index;

            var $label = $(
                '<label class="list-group-item d-flex gap-2 border-0">' +
                '<input class="form-check-input flex-shrink-0" type="radio" ' +
                'name="listGroupRadios" id="' + inputId + '" value="' + method.name + '" ' + isChecked + '>' +
                '<span>' +
                '<strong class="text-uppercase">' + method.name + '</strong>' +
                '</span>' +
                '</label>'
            );

            $container.append($label);
        });
    }

    function handleFail(xhr) {
        var res = xhr && xhr.responseJSON;
        var errorMsg = (res && res.message) ? res.message : 'Đặt hàng thất bại! Vui lòng thử lại.';
        alert(errorMsg);
    }

    function showQrModal(orderId, qrUrl, amount, transferContent) {
        // 4a. Gán dữ liệu vào modal
        $('#qr-order-id').text('#' + orderId);
        $('#qr-image').attr('src', qrUrl);
        $('#qr-amount').text(amount + 'VND');
        $('#qr-transfer-content').text(transferContent);

        // 4b. Hiển thị modal (dùng Bootstrap Modal API)
        var qrModal = new bootstrap.Modal(document.getElementById('qrPaymentModal'), {
            backdrop: 'static',   // Không cho click ngoài để đóng
            keyboard: false       // Không cho nhấn ESC để đóng
        });
        qrModal.show();

        // 4c. Bắt đầu đếm ngược 2 phút (120 giây)
        var timeLeft = 120; // 120 giây = 2 phút
        updateTimerDisplay(timeLeft);

        var countdown = setInterval(function () {
            timeLeft--;
            updateTimerDisplay(timeLeft);

            if (timeLeft <= 0) {
                // Hết giờ!
                clearInterval(countdown);
                qrModal.hide();
                alert('Hết thời gian thanh toán! Đơn hàng đã bị hủy. Vui lòng thực hiện lại.');
                window.location.href = 'cart.html';
            }
        }, 1000); // Chạy mỗi 1 giây

        // 4d. Nếu user nhấn nút "Tôi đã thanh toán"
        $('#btn-payment-done').off('click').on('click', function () {
            var $btnDone = $(this);
            $btnDone.prop('disabled', true).text('Đang xác nhận...');

            var token = localStorage.getItem('token');
            console.log(orderId)

            $.ajax({
                url: `${API_URL}/api/order/confirm`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    orderId: orderId
                }),
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
                .done(function () {
                    clearInterval(countdown); // Dừng đếm ngược
                    qrModal.hide();

                    // Tới đây mới thực sự đặt hàng thành công -> XÓA GIỎ HÀNG ở đây
                    localStorage.removeItem('cart');
                    if (typeof window.updateCartBadge === 'function') {
                        window.updateCartBadge();
                    }

                    alert('Cảm ơn bạn! Đơn hàng #' + orderId + ' đang được xử lý.');
                    window.location.href = 'thank-you.html';
                })
                .fail(function (xhr) {
                    console.error('Xác nhận thất bại:', xhr);
                    alert('Có lỗi khi xác nhận thanh toán. Vui lòng thử lại!');
                    $btnDone.prop('disabled', false).text('Tôi đã thanh toán');
                });
        });
    }

    // === 5. HÀM CẬP NHẬT HIỂN THỊ THỜI GIAN ĐẾM NGƯỢC ===
    function updateTimerDisplay(seconds) {
        var minutes = Math.floor(seconds / 60);
        var secs = seconds % 60;
        // Hiển thị dạng "01:45"
        var display = minutes.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        $('#qr-timer').text(display);

        // Đổi màu đỏ khi còn dưới 30 giây
        if (seconds <= 30) {
            $('#qr-timer').css('color', 'red');
        } else {
            $('#qr-timer').css('color', '#333');
        }
    }
});