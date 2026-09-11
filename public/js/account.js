$(document).ready(function () {
    $('#btn-login').click(function (e) {
        e.preventDefault(); // Ngăn trang bị reload

        var email      = $('#lg-email').val();
        var password   = $('#lg-password').val();
        var rememberMe = $('#remember-me').is(':checked'); // Đọc trạng thái checkbox Remember Me

        $.ajax({
            url: 'http://localhost:8081/auth/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email:      email,
                password:   password,
                rememberMe: rememberMe  // Gửi lên Backend để tính TTL
            })
        })
        .done(function (result) {
            console.log('Đăng nhập thành công:', result);

            // 1. Lưu token vào localStorage
            var token = (result.data && result.data.accessToken) ? result.data.accessToken : result.data;
            localStorage.setItem('token', token);

            // 2. Đọc tham số "redirect" trên thanh địa chỉ URL (nếu có)
            var urlParams   = new URLSearchParams(window.location.search);
            var redirectUrl = urlParams.get('redirect');
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                window.location.href = 'index.html';
            }
        })
        .fail(function (xhr) {
            var res = xhr.responseJSON;
            // Backend trả về { code: "4xx", status: "Tài khoản bị khóa..." }
            var errorMsg = (res && res.status) ? res.status : 'Đăng nhập thất bại, vui lòng thử lại!';

            // Hiển thị thông báo lỗi lên giao diện
            $('#login-alert').removeClass('d-none').text(errorMsg);
        });
    });

    // ===== THÊM PHẦN SIGNUP BÊN DƯỚI =====
    $('#btn-signup').click(function (e) {
        e.preventDefault();
        var fullName  = $('#exampleInputName').val().trim();
        var email     = $('#exampleInputEmail1').val().trim();
        var password  = $('#inputPassword1').val().trim();
        var rePassword = $('#inputPassword2').val().trim();
        var alertBox  = $('#signup-alert');
        // 1. Kiểm tra dữ liệu trước khi gửi đi
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
        // 2. Gửi API lên Backend
        $.ajax({
            url: 'http://localhost:8080/auth/signup',
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
            // Xóa trắng form sau khi đăng ký thành công
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