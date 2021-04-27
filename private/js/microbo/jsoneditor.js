(function() {

    /**
     * Jsoneditor
     */
    window.jsoneditor = async function (data) {
        
        //console.log(JSON.stringify(data));

        // Read json schema
        var json_schema = await fetch('microbo/api/read-schema', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({"hash": hash})
        })
        .then(res => res.json())
        .then(data => {   
            //console.log(data);
            return data;
        });

        //init typing speed for current value
        let typingTimer;                //timer identifier
        let doneTypingInterval = 500;  //time in ms (5 seconds)

        var trigger = 0;  // for drag-and-hold event
        var old_trigger = 0;

        // jsoneditor
        // set options
        const container = document.getElementById("jsoneditor");
        const options = {
            mode: 'tree',
            name: 'data',
            schema: json_schema,
            enableTransform: false,
            enableSort: false,
            limitDragging: false,
            // error
            onError: function (err) {
                alert(err.toString())
            },
            // context menu
            onCreateMenu(items, node) {

                const path = node.path;
                const paths = node.paths;

                // log the current items and node for inspection
                console.log('items:', items, 'node:', node);


                // Functions
                // We are going to add a menu item which returns the current node path
                // as a jq path selector ( https://stedolan.github.io/jq/ ). First we
                // will create a function, and then We will connect this function to
                // the menu item click property in a moment.

                function pathTojq() {
                    let pathString = 'data';

                    path.forEach(function (segment, index) { // path is an array, loop through it
                        if (typeof segment == 'number') {    // format the selector for array indexs ...
                            pathString += '[' + segment + ']';
                        } else {    // ... or object keys
                            pathString += '.' + segment + '';
                            //pathString += '["' + segment + '"]';
                        }
                    })

                    // Copy to clipboard
                    navigator.clipboard.writeText(pathString).then(function() {
                        console.log('Async: Copying to clipboard was successful!');
                    }, function(err) {
                        console.error('Async: Could not copy text: ', err);
                    });
                    
                    // Show dialog
                    new duDialog(
                        'JSON "data" path',
                        '<span class="text-muted">Path copied to clipboard</span><br><code>' + pathString + '</code>',
                        duDialog.OK, {
                            init: false,
                            okText: 'Close',
                            callbacks: {
                                okClick: function () {
                                    this.hide();
                                },
                            }
                        }
                    );
                }
                
                function removeFile() {
                    new duDialog(
                        'Delete file?',
                        'Careful! You are about to delete json file permanently',
                        duDialog.OK_CANCEL, {
                            init: false,
                            okText: 'Yes',
                            cancelText: 'No',
                            callbacks: {
                                okClick: function () {

                                    let filename = path[0];

                                    fetch('microbo/api/delete-json', {
                                        method: 'POST',
                                        headers: {
                                          'Accept': 'application/json',
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({"hash":hash, "filename": filename})
                                    })
                                    .then(res => res.json())
                                    .then(data => {   
                                        location.reload();
                                    });

                                    this.hide();
                                },
                                cancelClick: function () {
                                    this.hide();
                                }
                            }
                        }
                    );
                }

                function addUser() {
                    new duDialog(
                        'Add new user',
                        '<form id="create_user">\
                            <div class="form-group">\
                                <label for="username">Username</label>\
                                <input type="text" class="form-control" id="username" name="username">\
                            </div>\
                            <div class="form-group">\
                                <label for="password">Password</label>\
                                <input type="password" class="form-control" id="password" name="password">\
                            </div>\
                            <div class="form-group">\
                                <label for="email">email</label>\
                                <input type="email" class="form-control" id="email" name="email">\
                            </div>\
                        </form>',
                        duDialog.OK_CANCEL, {
                            init: false,
                            okText: 'Create',
                            cancelText: 'Cancel',
                            callbacks: {
                                okClick: function () {
                                    let payload = {
                                        "username": $('form#create_user').find("input[name='username']").val(),
                                        "email": $('form#create_user').find("input[name='email']").val(),
                                        "password": $('form#create_user').find("input[name='password']").val()
                                    }
                                    console.log(payload);
                                    if (payload.new_password != "") {

                                        fetch('microbo/api/create-user', {
                                            method: 'POST',
                                            headers: {
                                              'Accept': 'application/json',
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({"hash":hash, "payload": payload})
                                        })
                                        .then(res => res.json())
                                        .then(data => {   
                                            //console.log(data);
                                            location.reload();
                                        });
                                        
                                        this.hide();
                                    }
                                },
                                cancelClick: function () {
                                    $('#create_user').trigger("reset");
                                    this.hide();
                                }
                            }
                        }
                    );
                }

                function updateUser() {
                    new duDialog(
                        'Update user ' + data[path[0]][path[1]]["username"],
                        '<form id="update_user" data-for_user="' + data[path[0]][path[1]]["username"] + '">\
                            <div class="form-group">\
                                <label for="username">Username</label>\
                                <input type="text" class="form-control" id="username" name="username" value="' + data[path[0]][path[1]]["username"] + '" readonly>\
                            </div>\
                            <div class="form-group">\
                                <label for="email">email</label>\
                                <input type="email" class="form-control" id="email" name="email" value="' + data[path[0]][path[1]]["email"] + '">\
                            </div>\
                            <div class="form-group">\
                                <label for="new_password">New password</label>\
                                <input type="new_password" class="form-control" id="new_password" name="new_password" value="">\
                            </div>\
                            <div class="form-group">\
                                <label for="disabled">Disabled</label>\
                                <input type="text" class="form-control" id="disabled" name="disabled" value="' + data[path[0]][path[1]]["disabled"] + '">\
                            </div>\
                        </form>',
                        duDialog.OK_CANCEL, {
                            init: false,
                            okText: 'Update',
                            cancelText: 'Cancel',
                            callbacks: {
                                okClick: function () {
                                    let payload = {
                                        "username": $('form#update_user').find("input[name='username']").val(),
                                        "email": $('form#update_user').find("input[name='email']").val(),
                                        "new_password": $('form#update_user').find("input[name='new_password']").val() ? $('form#update_user').find("input[name='new_password']").val() : "not_set",
                                        "disabled": $('form#update_user').find("input[name='disabled']").val()
                                    }
                                    console.log(payload);
                                    if (payload.new_password != "") {
                                        fetch('microbo/api/update-user', {
                                            method: 'POST',
                                            headers: {
                                              'Accept': 'application/json',
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({"hash":hash, "payload": payload})
                                        })
                                        .then(res => res.json())
                                        .then(data => {   
                                            //console.log(data);
                                            location.reload();
                                        });
                                        this.hide();
                                    }
                                },
                                cancelClick: function () {
                                    $('form#update_user').trigger("reset");
                                    this.hide();
                                }
                            }
                        }
                    );
                }

                // Conditions
                // Create a new menu item. For our example, we only want to do this
                // if there is a path (in the case of appendnodes (for new objects)
                // path is null until a node is created)

                // Remove menu items in all levels
                items = items.filter(function (item) {
                    return item.text !== 'Extract';
                });
                /*items = items.filter(function (item) {
                    return item.text !== 'Remove';
                });*/

                // Add Copy object path action to any level
                items.push({
                    text: 'Copy object path', // the text for the menu item
                    title: 'Copies selected object path to clipboard', // the HTML title attribute
                    className: 'copy-path', // the css class name(s) for the menu item
                    click: pathTojq // the function to call when the menu item is clicked
                });

                // Top name
                if (path.length == 0) {
                    items = items.filter(function (item) {
                        return item.text !== 'Type';
                    });
                }

                // Actual objects
                if (path.length == 1) {

                    // Add Delete JSON file action to level 0
                    if (node.path[0].length) {
                        items.push({
                            text: 'Remove file', // the text for the menu item
                            title: 'Deletes JSON branch (a separate file from storage)', // the HTML title attribute
                            className: 'remove-file', // the css class name(s) for the menu item
                            click: removeFile // the function to call when the menu item is clicked
                        });
                    }

                    // Remove all built-in actions from level 0
                    if (node.path[0] == 'settings' || node.path[0] == 'users') {
                        items = items.filter(function (item) {
                            return item.type !== 'separator';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Insert';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Append';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Type';
                        });                            
                        items = items.filter(function (item) {
                            return item.text !== 'Remove file';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Duplicate';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Remove';
                        });
                    } else {
                        items = items.filter(function (item) {
                            return item.text !== 'Insert';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Duplicate';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Remove';
                        });
                    }
                }

                if (node.path.length > 0) {

                    // Settings
                    if (node.path[0] == 'settings') {

                        // Enable/Disable editable mode for settings
                        if (data.settings.microbo.jsoneditor.edit_settings != true ) {

                            items = items.filter(function (item) {
                                return item.type !== 'separator';
                            });
                            items = items.filter(function (item) {
                                return item.text !== 'Insert';
                            });
                            items = items.filter(function (item) {
                                return item.text !== 'Append';
                            });
                            items = items.filter(function (item) {
                                return item.text !== 'Type';
                            });                            
                            items = items.filter(function (item) {
                                return item.text !== 'Duplicate';
                            });
                            items = items.filter(function (item) {
                                return item.text !== 'Remove';
                            });

                        }
                    }

                    // Users
                    if (node.path[0] == 'users') {

                        items = items.filter(function (item) {
                            return item.type !== 'separator';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Insert';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Append';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Type';
                        });                            
                        items = items.filter(function (item) {
                            return item.text !== 'Duplicate';
                        });
                        items = items.filter(function (item) {
                            return item.text !== 'Remove';
                        });

                        if (node.path[1] === undefined) {
                            items.push({
                                text: 'Add new user', // the text for the menu item
                                title: 'Adds new user with a password', // the HTML title attribute
                                className: 'add-user', // the css class name(s) for the menu item
                                click: addUser // the function to call when the menu item is clicked
                            });
                        } else if (node.path[2] === undefined) {
                            items.push({
                                text: 'Update user', // the text for the menu item
                                title: 'Updates existing user', // the HTML title attribute
                                className: 'update-user', // the css class name(s) for the menu item
                                click: updateUser // the function to call when the menu item is clicked
                            });
                        }

                    }

                }
                
                // Remove custom func
                items.forEach(function (item, index, items) {
                    //console.log(items);
                    if (items[index].text == "Remove") {
                        let originalClick = items[index].click;
                        items[index].click = () => {
                            console.log('before default click');
                            originalClick();
                            console.log('after default click');
                            saveAll();
                        };
                    }
                });
                // Duplicate custom func
                items.forEach(function (item, index, items) {
                    //console.log(items);
                    if (items[index].text == "Duplicate") {
                        let originalClick = items[index].click;
                        items[index].click = () => {
                            console.log('before default click');
                            originalClick();
                            console.log('after default click');
                            saveAll();
                        };
                    }
                });

                // finally we need to return the items array. If we don't, the menu
                // will be empty.
                return items;

            },
            // update records (old method)
            onChangeJSON: function (node) {

               $('.jsoneditor-dragarea').mouseup(function () {
                    old_trigger = trigger;
                    trigger++;
                });
                if (trigger > old_trigger) {
                    saveAll();
                    trigger = old_trigger;
                }
            },
            
            // events
            onEvent: function(node, event) {
                //console.log(event);
                //console.log('event type: ' + event.type);
                //console.log(prettyPrintPath(node.path));
                
                if (event.type === 'focusin') {

                }

                if (event.type === 'keydown') {

                }

                // keyboard keyup event
                if (event.type === 'keyup') {
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(doneTyping, doneTypingInterval);
                }

                // checkbox click event via jquery
                $('.jsoneditor-tree input[type="checkbox"').on('click touchend',function(e){
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(doneTyping, doneTypingInterval);
                });

                // save to file after done typing
                function doneTyping () {
                    //do something
                    console.log('do something with :' + node.value + ' on path: ' + node.path);

                    loader('start');
 
                    fetch('microbo/api/update-json', {
                        method: 'POST',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({content: editor.get()[node.path[0]], file: node.path[0]})
                    })
                    .then(res => res.json())
                    .then(data => {   
                        loader('done');
                    });

                }

                // decorate node path
                function prettyPrintPath(path) {
                    let str = ''
                    for (let i=0; i<path.length; i++) {
                        const element = path[i]
                        if (typeof element === 'number') {
                            str += '[' + element + ']'
                        } else {
                            if (str.length > 0) str += '.'
                            str += element
                        }
                    }
                    return str
                }
            },
            // editable/non-editable records
            onEditable: function (node) {

                console.log(node);

                if (node.path != null) {
                    //console.log(node.path.length);

                    // Settings
                    if (node.path[0] == "settings") {

                        if (node.path[1] != null) {

                            // Editable imports
                            if (node.path[4] == "imports" && node.path[5] != null) {
                                return {
                                    field: true,
                                    value: true
                                }
                            }

                            // Enable/Disable editable mode for settings
                            if (data.settings.microbo.jsoneditor.edit_settings == true ) {
                                return {
                                    field: true,
                                    value: true
                                }
                            } else {

                                // Edit Settings is always accessible
                                if (node.path[3] == "edit_settings") {
                                    return {
                                        field: false,
                                        value: true
                                    }
                                }

                                // Edit Users is always accessible
                                if (node.path[3] == "edit_users") {
                                    return {
                                        field: false,
                                        value: true
                                    }
                                }

                                return {
                                    field: false,
                                    value: false
                                }

                            }
                        }

                    }


                    // Users
                    if (node.path[0] == "users") {

                        if (node.path[1] != null) {

                            if (data.settings.microbo.jsoneditor.edit_users == true ) {
                                return {
                                    field: true,
                                    value: true
                                }
                            } else {
                                return {
                                    field: false,
                                    value: false
                                }
                            }
                        }
                    }



                    // Rest files
                    if (node.path.length == 1) {
                        return {
                            field: false,
                            value: false
                        }
                    }
                }
                /*
                switch (node.field) {
                    default:
                        return true;
                }*/
                return true;
            }
        };

        // create jsoneditor with options
        editor = new JSONEditor(container, options);

        // load json to jsoneditor
        editor.set(data);

        // add button to jsoneditor to add new json file
        $(".jsoneditor-menu").append('<button type="button" id="add_json" class="jsoneditor-separator">Add new JSON</button>');
        $('#add_json').click(function(){

            new duDialog(
                'Add empty JSON file to Data object',
                '<form id="create_json">\
                    <div class="form-group">\
                        <label for="filename">Filename</label>\
                        <div class="input-group">\
                            <input type="filename" class="form-control" id="filename" name="filename">\
                            <div class="input-group-append">\
                                <span class="input-group-text">.json</span>\
                            </div>\
                        </div>\
                    </div>\
                </form>',
                duDialog.OK_CANCEL, {
                    init: false,
                    okText: 'Add',
                    cancelText: 'Cancel',
                    callbacks: {
                        okClick: function () {
                            fetch('microbo/api/create-json', {
                                method: 'POST',
                                headers: {
                                  'Accept': 'application/json',
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({"hash": hash, "filename": $('form#create_json').find('input[name="filename"]').val()})
                            })
                            .then(res => res.json())
                            .then(data => {   
                                //console.log(data);
                                this.hide();
                                if (data == true) location.reload();
                            });
                        },
                        cancelClick: function () {
                            this.hide();
                        }
                    }
                }
            );
        });
        
        // add button to jsoneditor to update schema file
        $(".jsoneditor-menu").append('<button type="button" id="create_schema" >Update schema</button>');
        $('#create_schema').click(function(){
            new duDialog(
                'Create new JSON Schema file?',
                'Careful! If schema file already exists it will be replaced',
                duDialog.OK_CANCEL, {
                    init: false,
                    okText: 'Yes',
                    cancelText: 'No',
                    callbacks: {
                        okClick: function () {

                            fetch('microbo/api/create-schema', {
                                method: 'POST',
                                headers: {
                                  'Accept': 'application/json',
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({"hash": hash})
                            })
                            .then(res => res.json())
                            .then(data => {   
                                //console.log(data);
                                location.reload();
                            });

                            this.hide();
                        },
                        cancelClick: function () {
                            this.hide();
                        }
                    }
                }
            );
        });

        // add extra func to built-in actions
        $('.jsoneditor-remove').on('click', function(){
            console.log('jsoneditor-remove');
            saveAll();
        });

        $('.jsoneditor-undo').on('click', function(){
            console.log('jsoneditor-undo');
            saveAll();
        });
        $('.jsoneditor-redo').on('click', function(){
            console.log('jsoneditor-redo');
            saveAll();
        });
        $('.jsoneditor-duplicate').click(function(){
            console.log('!!!jsoneditor-duplicate');
        });


        // save to file after done typing
        function saveAll () {
            //do something
            console.log(editor.get());

            loader('start');

            fetch('microbo/api/update-json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"hash": hash, "content": editor.get(), "file": "_all"})
            })
            .then((data) => {
                loader('done');
            });
        }
        
        // alter visuals
        $('table.jsoneditor-values').each( function( index, value ){
            if ($(this).css('margin-left') == '24px'){
                //your code
                $(this).find('td.jsoneditor-tree:nth-child(2)').addClass('json-file');
                console.log($(this).css('margin-left'));
            }
        });
	};   
    
})(jQuery);