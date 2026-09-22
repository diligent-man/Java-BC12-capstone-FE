import {API_URL} from './config';


$(document).ready(function () {
    // === TOGGLE UI BASED ON LOGIN STATE ===
    function updateAccountPageUI() {
        var token = localStorage.getItem('token');
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
        var token = localStorage.getItem('token');

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

        var email = $('#lg-email').val();
        var password = $('#lg-password').val();
        var rememberMe = $('#remember-me').is(':checked');

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
                var token = (result.data && result.data.token) ? result.data.token : null;

                if (!token) {
                    $('#login-alert').removeClass('d-none').text('Đăng nhập thất bại: không nhận được token.');
                    return;
                }

                localStorage.setItem('token', token);

                // 2. Đọc tham số "redirect" trên thanh địa chỉ URL (nếu có)
                var urlParams = new URLSearchParams(window.location.search);
                var redirectUrl = urlParams.get('redirect');
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'index.html';
                }
            })
            .fail(function (xhr) {
                var res = xhr.responseJSON;
                var errorMsg = (res && res.message) ? res.message : 'Đăng nhập thất bại, vui lòng thử lại!';
                $('#login-alert').removeClass('d-none').text(errorMsg);
            });
    });

    // ===== SIGNUP =====
    $('#btn-signup').click(function (e) {
        e.preventDefault();
        var fullName = $('#exampleInputName').val().trim();
        var email = $('#exampleInputEmail1').val().trim();
        var password = $('#inputPassword1').val().trim();
        var rePassword = $('#inputPassword2').val().trim();
        var alertBox = $('#signup-alert');

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
                var res = xhr.responseJSON;
                var errorMsg = (res && res.status) ? res.status : 'Đăng ký thất bại! Vui lòng thử lại.';
                alertBox.removeClass('d-none alert-success').addClass('alert-danger')
                    .text(errorMsg);
            });
    });
});
