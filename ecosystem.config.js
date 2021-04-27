// Read Settings
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('storage/settings.json', 'utf8'));

module.exports = {
    apps : [{
        name: settings.microbo.name,
        script: 'app.js',

        // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
        args: 'one two',
        instances: 1,
        autorestart: settings.pm2.autorestart,
        watch: settings.pm2.watch,
        max_memory_restart: settings.pm2.max_memory_restart,
        exec_mode: settings.pm2.exec_mode,
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }],


    deploy : {
        production : {
            user : 'node',
            host : '212.83.163.1',
            ref    : 'origin/master',
            repo : 'git@github.com:repo.git',
            path : '/var/www/production',
            'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }

};
