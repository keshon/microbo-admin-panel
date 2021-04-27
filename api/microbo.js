var express = require('express');
var router = express.Router();


// Middleware
// Check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/microbo');
    } else {
        next();
    }    
};

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

    //console.log(res.locals.hash);

    if (req.session.user && req.cookies.user_sid) {

        // Requires
        const fetch = require("node-fetch");

        // Fetch get data
        fetch(res.locals.base_url + 'microbo/api/data', {
            method: 'post',
            body: JSON.stringify({hash: res.locals.hash, select: 'settings'}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(res => res.json())
        .then(data => {

            // Render the Moon
            res.render('microbo-manager/microbo.html', {data: data, hash: res.locals.hash});
        });

    } else {
        res.redirect('/microbo/signin');
    }

});

// Sign-in route
router.get('/signin', hash, sessionChecker, function(req, res) {

    // Requires
    const fetch = require("node-fetch");

    // Fetch get data
    fetch(res.locals.base_url + 'microbo/api/data', {
        method: 'post',
        body: JSON.stringify({hash: res.locals.hash, select: 'settings'}),
        headers: {'Content-Type': 'application/json'}
    })
	.then(res => res.json())
    .then(data => {
        
        // Render the Moon
        res.render('microbo-manager/signin.html', {data: data, hash: res.locals.hash});
    });

});

// Jq-Router Templates route
router.get('/tpl/:alias', hash, function(req, res) {

    // Render the Moon
    res.render('microbo-manager/tpl/' + req.params.alias, {hash: res.locals.hash});

});

// Test Page route
router.get('/test-page', hash, function(req, res) {

    if (req.session.user && req.cookies.user_sid) {

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

    } else {
        res.redirect('/microbo/signin');
    }
});
module.exports = router;