$(document).ready(function(){

      $('#btn-login').click(function(){
        
        var email = $('#lg-email').val()
        var password = $('#lg-password').val()
        
        $.ajax({
            method: "POST",
            url: "http://localhost:8080/auth/sign-in",
            contentType: 'application/json',
            data: JSON.stringify({
                 email: email, 
                 password: password 
                })
        })
        .done(function( result ) {
            localStorage.setItem('token',result.data)
        });

      })  

})