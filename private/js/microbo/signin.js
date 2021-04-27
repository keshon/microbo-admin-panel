(function() {

    /**
     * Signin
     */
    window.signin = function () {

        window.history.pushState('Sign-in', 'Sign-in', window.location.href.split('#')[0]);
        window.history.pushState('Sign-in', 'Sign-in', window.location.href.split('?')[0]);

        // Sign-in form
        $('form#signin').submit(function(e) {
            e.preventDefault();

            $(this).find('button span').show();

            fetch('microbo/api/auth', {
                body: JSON.stringify({hash: hash, username: $(this).find('[name="username"]').val(), password: $(this).find('[name="password"]').val()}),
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                
                console.log(data);
                
                $(this).find('button span').hide();
                $('#alert_container').html(
                    '<div class="alert alert-' + data.status + '" role="alert">\
                    ' + data.message + '.\
                    </div>'
                );
                
                if (data.status == "success") window.location = data.redirect;
            });
        });
	};
    
})(jQuery);