let express = require('express');
let router = express.Router();

// Middleware
// Hash secret word from storage json settings
var hash = (req, res, next) => {

    // Requires
    const bcrypt = require('bcrypt');
    const fs = require('fs');

    // Get data
    let rawdata = fs.readFileSync('./storage/settings.json');
    let settings = JSON.parse(rawdata);
    
    // Hash the word
    bcrypt.genSalt(5, function(err, salt) {
        bcrypt.hash(settings.secret, salt, function(err, hash) {
            // Store hash to locals (for public exposing)
            res.locals.hash = hash;
            // Store base_url to locals (for fetching)
            res.locals.base_url = settings.base_url;
            next();
        });
    });
};


// Routes
// Home page route
router.get('/', hash, function(req, res) {

    // Requires
    const fetch = require("node-fetch");

    // Fetch get data
    fetch(res.locals.base_url + 'microbo/api/data', {
        method: 'post',
        body: JSON.stringify({hash: res.locals.hash, select: ['settings']}),
        headers: {'Content-Type': 'application/json'}
    })
	.then(res => res.json())
    .then(data => {

        // Render the Moon
        res.render('microbo-test/test.html', {data: data});
    });

});


module.exports = router;
