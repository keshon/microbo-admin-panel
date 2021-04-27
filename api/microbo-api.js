/**
 * Prelude
 */

// Requires
const express = require('express');

// Init
const router = express.Router();
router.use(express.json());


/**
 * Middlewares
 */

// Verify hash
var verifyHash = (req, res, next) => {

    // Requires
    const fs = require('fs');
    const bcrypt = require('bcrypt');

    // Post
    let post = req.body;

    // Read settings
    let settings = JSON.parse(fs.readFileSync('./storage/settings.json'));

    // Compare secret word with hash
    bcrypt.compare(settings.secret, post.hash, function(err, bcryptResponse) {
        if(bcryptResponse) {
            // Match

            // Store base_url to locals (for fetching)
            res.locals.base_url = settings.base_url;        

            // Return
            next();
        } else {
            // Don't match

            // Return
            res.send('wrong hash');
        }
    });
};

// Read json content in storage dir
var readData = (req, res, next) => {

    // Requires
    const glob = require("glob");
    const fs   = require("fs");
    const path = require("path");

    // POST or func param 'select'
    let files;

    if (req.body && req.body.select) {
        files = req.body.select;
    } else {
        files = select;
    }

    // Check for 'select' post param which is selective list of json content
    // or get all json content except _schema.json which is JSON schema
    let content = [];
    if (files != null) {

        // Select bunch of content if passed as array
        if (Array.isArray(files)) {
            // Iterate over list and store file paths
            files.forEach(function (file) {
                content.push(glob.sync(__dirname + "/../storage/" + file + ".json").toString());
                /*
                // Always add settings.json
                content.push(glob.sync(__dirname + "/../storage/settings.json").toString());
                // Add additional json content
                if (file != 'settings') {
                    content.push(glob.sync(__dirname + "/../storage/" + file + ".json").toString());
                }
                */
            });
        } else {
            // Select all json content or one specific
            if (files == '_all') {
                content = glob.sync(__dirname + "/../storage/*.json", {ignore: __dirname + "/../storage/_schema.json"});
            } else {
                content.push(glob.sync(__dirname + "/../storage/" + files + ".json").toString());
            }
        }

    } else {
        console.log("This error should never be thrown");
    }

    // Save all content content to string
    let data = '';
    content.forEach(function (file) {
        data += '"' + path.basename(file).replace(".json", "") + '"' + ':' + fs.readFileSync(file, "utf8") + ',';
    });
    
    // Make it JSON string compatible
    data = '{' + data.slice(0, -1) + '}';

    // Save to local
    res.locals = data;
    next();
};


/**
 * Toolbox
 */

// Compile SCSS to CSS
router.post('/compile-scss', 
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select=['settings']) }, 
    async (req, res) => {

    // Requires
    const fs = require('fs');
    const sass = require('node-sass');

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Read export filename and source filenames
    let path = {};
    if (post.app == "app") {
        path = {
            'imports': data.settings.app.path.style.imports,
            'file': data.settings.app.path.style.file,
        };
    } else if (post.app == "microbo") {
        path = {
            'imports': data.settings.microbo.path.style.imports,
            'file': data.settings.microbo.path.style.file,
        };
    }

    // Compile to CSS
    let compiledContent = '';
    for (let key in path.imports) {
        compiledContent += sass.renderSync({
            file: path.imports[key],
            outputStyle: 'compressed'
        })
        .css.toString().trim();
    }

    // Save to file
    fs.closeSync(fs.openSync(path.file, 'w'));
    let stream = fs.createWriteStream(path.file);
    stream.once('open', function(fd) {
        stream.write(compiledContent);
        stream.end();
    });

    // Return
    res.send(true);
});

// Compress JS files
router.post('/compress-js', 
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select=['settings']) }, 
    async (req, res) => {

    // Requires
    const fs = require('fs');
    const uglifyjs = require("uglify-es");

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Read export filename and source files content
    let pathAndContent = {};
    if (post.app == "app") {
        var importPaths = data.settings.app.path.script.imports;
        var content = [];
        var file = data.settings.app.path.script.file;

    } else if (post.app == "microbo") {

        var importPaths = data.settings.microbo.path.script.imports;
        var content = [];
        var file = data.settings.microbo.path.script.file;
    }

    for (var i = 0; i < importPaths.length; i++) {
        content[i] = fs.readFileSync(importPaths[i], "utf8");
    }

    pathAndContent = {
        'imports': content,
        'file': file
    };

    // Compress Content
    let options = {
        ie8: false,
    };
    minifiedContent = uglifyjs.minify(pathAndContent.imports, options);

    // Save to file
    fs.closeSync(fs.openSync(pathAndContent.file, 'w'));
    var stream = fs.createWriteStream(pathAndContent.file);
    stream.once('open', function(fd) {
        stream.write(minifiedContent.code);
        stream.end();
    });

    // Return
    res.send(true);
});

// (fallback) Compress JS files for MICROBO
// It's not secure as 'verifyHash' is omitted
router.get('/compress-js-microbo',
    (req, res, next) => { readData(req, res, next, select=['settings']) }, 
    async (req, res) => {

    // Requires
    const fs = require('fs');
    const uglifyjs = require("uglify-es");

    // Prepare Data
    let data = JSON.parse(res.locals);

    var importPaths = data.settings.microbo.path.script.imports;
    var content = [];
    var file = data.settings.microbo.path.script.file;

    for (var i = 0; i < importPaths.length; i++) {
        content[i] = fs.readFileSync(importPaths[i], "utf8");
    }

    pathAndContent = {
        'imports': content,
        'file': file
    };

    // Compress Content
    let options = {
        ie8: false,
    };
    minifiedContent = uglifyjs.minify(pathAndContent.imports, options);

    // Save to file
    fs.closeSync(fs.openSync(pathAndContent.file, 'w'));
    var stream = fs.createWriteStream(pathAndContent.file);
    stream.once('open', function(fd) {
        stream.write(minifiedContent.code);
        stream.end();
    });

    // Return
    res.send(true);
});


/**
 * Data (JSON) manipulation
 */

// Сreate empty JSON file
router.post("/create-json", verifyHash, (req, res)=>{

    // Requires
    const fs = require("fs");

    // Get POST
    let post = req.body;

    // Create file
    if (post.filename !== '') {
        fs.writeFile('storage/' + post.filename + '.json', '{}', function (err) {
            if (err) throw err;

            // Return
            res.send(true);
        });
    } else {
        // Return
        res.send(false);
    }
});

// Read selective/all JSON files as Data
// That is public restful access
router.post("/data", verifyHash, readData, (req, res)=>{

    // Return
    res.send(res.locals);
});

// Update existing JSON file
router.post("/update-json", (req, res)=>{
    
    // Requires
    const fs = require("fs");

    // Get POST
    let post = req.body;

    const file = post.file;
    const content = post.content;

    if (file === "_all") {
        Object.keys(content).forEach(function(key) {
            fs.writeFile("storage/" + key + ".json", JSON.stringify(content[key]), function(err) {
                if(err) res.send(err);
            });
        });

        // Return
        res.send(true);
    } else {
        fs.readFile('storage/' + file + '.json', 'utf8', (e, data) => {
            //const obj = JSON.parse(data);
            fs.writeFile('storage/' + file + '.json', JSON.stringify(content), function writeJSON(err) {
                if(err) res.send(err);

                // Return
                res.send(true);
            });
        });
    }
});

// Delete existing JSON file
router.post("/delete-json", verifyHash, (req, res)=>{
    
    // Requires
    const fs = require("fs");

    // Get POST
    let post = req.body;

    // Delete file
    fs.unlink('storage/' + post.filename + '.json', function (err) {
        if (err) throw err;

        // Return
        res.send(true);
    }); 
});

// Create new JSON Schema
router.post("/create-schema",
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select='_all') }, 
    (req, res) => {
    
    // Requires
    const fs = require("fs");
    const jsg = require("jsg07");

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Create Schema
    var schema = jsg.infer(data);

    // Create file
    fs.writeFile('storage/_schema.json', JSON.stringify(schema), function (err) {
        if (err) throw err;

        // Return
        res.send(true);
    });
});

// Read existing JSON Schema
router.post("/read-schema",
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select='_schema') }, 
    (req, res) => {

    // Requires
    const fs = require("fs");

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Return
    if(data) {
        res.send(data._schema);
    } else {
        res.send(false); // no schema exist
    }
});


/**
 * User Management
 */

// Create User
router.post("/create-user", 
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select=['users']) }, 
    (req, res) => {

    // Requires
    const fs = require("fs");
    const bcrypt = require('bcrypt');

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Hash the word
    bcrypt.genSalt(5, function(err, salt) {
        bcrypt.hash(post.payload.password, salt, function(err, hash) {

            // Add new user
            let newUser = [{
                "username": post.payload.username,
                "hashed_password": hash,
                "email": post.payload.email,
                "disabled": true
            }];
            data.users = data.users.concat(newUser);

            // Write changes
            fs.writeFile("storage/users.json", JSON.stringify(data.users), function(err) {
                if(err) res.send(err);

                // Return
                res.send(true);
            });
        });
    });
});

// Update User
router.post("/update-user",
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select=['users']) }, 
    (req, res) => {

    // Requires
    const fs = require("fs");
    const bcrypt = require('bcrypt');

    // Get POST
    let post = req.body;

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Try to find user in storage (data) by username
    var existUser = data.users.filter(obj => {
        return obj.username === post.payload.username;
    });

    // Verify password if user was found
    if (existUser[0] !== undefined) {

        // Change values (except password)
        existUser[0].username = post.payload.username;
        existUser[0].email = post.payload.email;
        existUser[0].disabled = JSON.parse(post.payload.disabled);

        // Change password field
        if (post.payload.new_password != 'not_set') {

            // Hash the word (sync way)
            let salt = bcrypt.genSaltSync(5);
            let hash = bcrypt.hashSync(post.payload.new_password, salt);

            existUser[0].hashed_password = hash;
        }

        // Filter users except the one updated
        var excludeExistUser = data.users.filter(obj => {
            return obj.username != post.payload.username;
        });

        // Merge arrays
        excludeExistUser = excludeExistUser.concat([existUser[0]]);

        // Write changes
        fs.writeFile("storage/users.json", JSON.stringify(data.users), function(err) {
            if (err) throw err;

            // Return
            res.send(true);
        });

    } else {
        res.json({"status": "danger", "message": "User not found"});
    }
});

// Authenticate User
router.post('/auth',
    verifyHash, 
    (req, res, next) => { readData(req, res, next, select=['users','settings']) }, 
    (req, res) => {

    // Requires
    const bcrypt = require('bcrypt');

    // Get POST
    let post = req.body;
    console.log(post);

    // Prepare Data
    let data = JSON.parse(res.locals);

    // Try to find user in storage (data) by username
    var existUser = data.users.filter(obj => {
        return obj.username === post.username;
    });

    // Verify password if user was found
    if (existUser[0] !== undefined) {

        if (!existUser[0].disabled) {

            bcrypt.compare(post.password, existUser[0].hashed_password, function(err, bcryptRes) {
                if (err) {
                    res.json({"status": "danger", "message": err});
                }
                if (bcryptRes) {
                    req.session.user = existUser[0];

                    var defaultRoute = data.settings.microbo.jqrouter.default_route;
                    var defaultRouteAlias = data.settings.microbo.jqrouter.routes[defaultRoute].alias;

                    res.json({"status": "success", "message": "User found", "redirect": "microbo/#/" + defaultRouteAlias});                
                } else {
                    res.json({"status": "warning", "message": "Wrong password"});
                }
            });

        } else {
            res.json({"status": "warning", "message": "User is inactive"});
        }

    } else {
        res.json({"status": "danger", "message": "User not found"});
    }
});

// Log out User
router.get('/logout', (req, res) => {

    if (req.session.user && req.cookies.user_sid) {

        res.clearCookie('user_sid');
        res.redirect('/');
    } else {

        res.redirect('/microbo/signin');
    }
});


/**
 * Widgets and non-critical stuff
 */

// Read System Information
router.post("/si", verifyHash,  async (req, res) => {

    // Require
    const si = require('systeminformation');
 
    // CPU
    let cpu = await si.currentLoad()
    .then(data => {
        return data;
    })
    .catch(error => console.error(error));

    // Memory
    let mem = await si.mem()
    .then(data => {
        return data;
    })
    .catch(error => console.error(error));

    let memUsedPercent = mem.used / mem.total;

    // Network
    let net = await si.networkStats()
    .then(data => {
        return data[0];
    })
    .catch(error => console.error(error));

    res.json({"cpu": cpu.currentload / 100, "mem": memUsedPercent, "net_tx": net.tx_sec, "net_rx": net.rx_sec});

});

// Route Test
router.get("/test", async (req, res)=>{
    
    let results = {
        "test": "passed", 
        "your_ip_address": req.connection.remoteAddress,        
        "your_user_agent": req.get('User-Agent')
    };

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(results, null, 4));

});

module.exports = router;