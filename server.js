/**
 * Prelude
 */

// Read Settings
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./storage/settings.json', 'utf8'));


/**
 * Create Express app
 */

const express = require('express');
const app = express();
const port = data.port;


/**
 * Express Settings
 */

// Static dirs location
app.use(express.static('public'));
app.use(express.static('private')); // it's for dev purposes.

// Minify HTML
var minifyHTML = require('express-minify-html');
app.use(minifyHTML({
    override:      true,
    exception_url: false,
    htmlMinifier: {
        removeComments:            true,
        collapseWhitespace:        true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes:     true,
        removeEmptyAttributes:     true,
        minifyJS:                  true
    }
}));

// Enable Compression
var compression = require('compression');
app.use(compression());

// Body parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cookie parser
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// Express Session
var session = require('express-session');
app.use(session({
    key: 'user_sid',
    secret: data.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: data.microbo.cookie_expire
    }
}));

// Nunjucks Template Engine
var path = require('path');
var nunjucks = require('nunjucks');
nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true
});


/**
 * Middlewares
 */

// Empty middleware
app.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

// Check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});


/**
 * Routes
 */

// MyApp
app.use('/', require('./api/myapp'));

// Microbo
app.use('/microbo', require('./api/microbo'));
app.use('/microbo/api', require('./api/microbo-api'));


/**
 * Server
 */

// Start
const server = app.listen(port, () => {
    const host = server.address().address;
    const { port } = server.address();
  
    console.log('Example app listening at http://%s:%s', host, port);
});