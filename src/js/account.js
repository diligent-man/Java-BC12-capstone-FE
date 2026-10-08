import {API_URL} from './config';
import {isAdmin} from './auth.js';

$(document).ready(function () {
    updateOffcanvasCart();

    // === TOGGLE UI BASED ON LOGIN STATE ===
    function updateAccountPageUI() {
        const token = localStorage.getItem('token');
        if (token) {
            $('.login-tabs').hide();
            $('#logged-in-section').show();
        } else {
            $('.login-tabs').show();
            $('#logged-in-section').hide();
        }
    }

    $('#btn-logout').on('click', function (e) {
        e.preventDefault();
        const token = localStorage.getItem('token');

        function finish() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }

        if (!token) {
            finish();
            return;
        }

        $.ajax({
            url: `${API_URL}/auth/signout`,
            type: 'POST',
            headers: {'Authorization': 'Bearer ' + token}
        }).always(finish);
    });

    updateAccountPageUI();

    // === LOGIN ===
    $('#btn-login').click(function (e) {
        e.preventDefault();

        const email = $('#lg-email').val();
        const password = $('#lg-password').val();
        const rememberMe = $('#remember-me').is(':checked');

        $.ajax({
            url: `${API_URL}/auth/signin`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: email,
                password: password,
                rememberMe: rememberMe
            })
        })
            .done(function (result) {
                console.log('Đăng nhập thành công:', result);

                // 1. Lưu token vào localStorage
                const token = (result.data && result.data.token) ? result.data.token : null;

                if (!token) {
                    $('#login-alert').removeClass('d-none').text('Đăng nhập thất bại: không nhận được token.');
                    return;
                }

                localStorage.setItem('token', token);

                // 2. Đọc tham số "redirect" trên thanh địa chỉ URL (nếu có)
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                if (redirectUrl === 'add-product.html') {
                    // this target is admin-only — verify role before honoring it
                    if (isAdmin(token)) {
                        window.location.href = 'add-product.html';
                    } else {
                        alert("Bạn cần đăng nhập dưới quyền admin để thêm sản phẩm!");
                        window.location.href = 'index.html';
                    }
                } else if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'index.html';
                }
            })
            .fail(function (xhr) {
                const res = xhr.responseJSON;
                const errorMsg = (res && res.message) ? res.message : 'Đăng nhập thất bại, vui lòng thử lại!';
                $('#login-alert').removeClass('d-none').text(errorMsg);
            });
    });

    // ===== SIGNUP =====
    $('#btn-signup').click(function (e) {
        e.preventDefault();
        const fullName = $('#exampleInputName').val().trim();
        const email = $('#exampleInputEmail1').val().trim();
        const password = $('#inputPassword1').val().trim();
        const rePassword = $('#inputPassword2').val().trim();
        const alertBox = $('#signup-alert');

        if (!fullName || !email || !password || !rePassword) {
            alertBox.removeClass('d-none alert-success').addClass('alert-danger')
                .text('Vui lòng điền đầy đủ tất cả các trường!');
            return;
        }
        if (password !== rePassword) {
            alertBox.removeClass('d-none alert-success').addClass('alert-danger')
                .text('Mật khẩu nhập lại không khớp!');
            return;
        }

        $.ajax({
            url: `${API_URL}/auth/signup`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                fullName: fullName,
                email: email,
                password: password
            })
        })
            .done(function () {
                alertBox.removeClass('d-none alert-danger').addClass('alert-success')
                    .text('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
                $('#exampleInputName').val('');
                $('#exampleInputEmail1').val('');
                $('#inputPassword1').val('');
                $('#inputPassword2').val('');
            })
            .fail(function (xhr) {
                const res = xhr.responseJSON;
                const errorMsg = (res && res.status) ? res.status : 'Đăng ký thất bại! Vui lòng thử lại.';
                alertBox.removeClass('d-none alert-success').addClass('alert-danger')
                    .text(errorMsg);
            });
    });
});
