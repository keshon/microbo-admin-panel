(function() {

    /**
     * Actions
     */
    window.actions = function (preview_url) {

        // Compile SCSS
        $('#compile_scss').click(function(){

            loader('start');

            let select_app = $('#select_app').val();

            $(this).find('span').show();

            fetch('microbo/api/compile-scss', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({"app": select_app, "hash": hash})
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                $(this).find('span').hide();
                loader('done');
            });

        });


        // Compress JS
        $('#compress_js').click(function(){

            //NProgress.start();
            loader('start');

            let select_app = $('#select_app').val();

            $(this).find('span').show();

            fetch('microbo/api/compress-js', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({"app": select_app, "hash": hash})
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                $(this).find('span').hide();
                loader('done');
            });
        });

        // Logout button
        $('#logout').click(function(){
            new duDialog(
                null,
                'Sign out?',
                duDialog.OK_CANCEL, {
                    init: false,
                    okText: 'Yes',
                    cancelText: 'No',
                    callbacks: {
                        okClick: function () {
                            window.location.href = "microbo/api/logout";
                            this.hide();
                        },
                        cancelClick: function () {
                            this.hide();
                        }
                    }
                }
            );
        });

        // Preview button
        $('#preview').click(function(){
            window.open(preview_url, '_blank');
        });

        // Select app/microbo
        $("#select_app_dropdown a ").click(function(){
            $('#select_app').val($(this).text());
            $("#select_app_dropdown button").html($(this).text());

            if ($(this).text() == "microbo") {
                $("body").addClass("danger");
            } else {
                $("body").removeClass("danger");
            }
        });

	};    
    
})(jQuery);