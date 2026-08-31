$(document).ready(function() {
    $('#btn-login').click(function() {
        var email = $('#lg-email').val(); //lấy ra thông tin email từ form bên html
        var password = $('#lg-password').val(); // lấy ra thông tin password từ form bên html

        $.ajax({
            url: 'http://localhost:8080/auth/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: email, //truyền giá trị email vào api
                password: password  //truyền giá trị password vào api
            })
        }).done(function(result) {
            console.log('kiemtra ', result); // Handle the login result
        });
    });
});