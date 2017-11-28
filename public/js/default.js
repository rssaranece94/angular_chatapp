var jq = $.noConflict();

 jq(function() {

     jq(document).on('click', '.navbar-collapse', function(e) {
         jq('.navbar-collapse.in').collapse('hide');
     });

     // toggle the left side menu on click on button
     jq('.navbar-header').on('click', '.menu-toggle', function() {
         jq('.left').toggleClass('left-hide');
         jq(this).toggleClass('menu-open');
     });


 });

 var leftMenuToggle = function () {
     // window resize functions
     jq(window).resize(function() {
         var width = jq(this).width();
         var height = jq(this).height();
         var section_height = height - 97;
         if (width >= 640) {
             jq('.left').removeClass('left-hide');
             jq('.left').css('height', height);
             jq('.right').css('display', 'block');
         } else if (width <= 639) {
             jq('.left').addClass('left-hide');
         }
     }).resize();

     // toggle the left side menu on click on right section
     jq('.right').on('click', function() {
         jq('.left').addClass('left-hide');
         jq('.navbar-header .menu-toggle').removeClass('menu-open');
     });

 }

 var inputBlur = function() {
     // hide and show modern input labels
     jq("form").on('blur', 'input', function() {
         if (jq(this).val() !== '') {
             jq(this).siblings(".label").hide(100);
         } else jq(this).siblings(".label").show(100);
     }).focus(function() {
         jq(this).siblings(".label").show(0);
     });
 }


 var formValidate = function() {
     // validate the login and signup form
     var $validator = jq("#login-form, #signup-form, #forgot, #reset").validate({
         rules: {
             email: {
                 required: true,
                 email: "Please enter valid email"
             },
             password: {
                 required: true,
                 minlength: 4
             },
             pwd: {
                 required: true,
                 minlength: 4,
                 equalTo: "#password"
             },
             username: {
                 required: true
             },
             forgot_email: {
                 required: true,
                 email: "Please enter email to reset password"
             },
             reset_password: {
                 required: true,
                 minlength: 4
             },
             reset_password_1: {
                 required: true,
                 minlength: 4,
                 equalTo: "#reset-pwd"
             }
         },
         
         highlight: function(element) {
             jq(element).closest('.input-control').removeClass('has-success').addClass('has-error');
         },
         unhighlight: function(element) {
             jq(element).closest('.input-control').removeClass('has-error').addClass('has-success');
         },
         errorElement: 'span',
         errorClass: 'help-block',
         errorPlacement: function(error, element) {
             if (element.parent('.input-control').length) {
                 error.insertAfter(element.parent());
             } else {
                 error.insertAfter(element);
             }
         }
     });
 }
