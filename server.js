var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var winston = require('winston');
var utils = require('../libs/utils');
var bodyParser = require('body-parser');
var jsonMerger = require('json-merger');

var config = require('./config/config');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            timestamp: function() {
                return utils.now();
            },
            colorize: true,
            level: 'debug'
        }),
        new(winston.transports.File)({
            timestamp: function() {
                return utils.now();
            },
            filename: 'logs/server_access.log',
            json: false
        })
    ]
});

/*var heartbeats = require('../libs/heartbeats');
heartbeats.setLogger(mssqlLogger);
heartbeats.setDB(mssql);
heartbeats.init(config.server.serviceName);*/

/*app.use(
    bodyParser.text({ type: 'application/x-www-form-urlencoded' })
);*/

http.listen(config.server.port, function() {
    logger.info('Web Service started on port ' + config.server.port);
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

app.get('/', function(req, res, next) {
    res.render(__dirname + '/views/index');
});

app.get('/client', function(req, res, next) {
    res.render(__dirname + '/views/client');
});

app.use(function(req, res, next) {
    logger.error('404: Page not Found | Query string: ' + JSON.stringify(req.params));
    res.status(404).send('404: Page not Found');
});

var panel;
var clients = [];

io.on('connection', function(socket) {
    console.log('RTA Client online');
    socket.on('disconnect', function() {
        console.log('RTA Client offline');
    })

    socket.on('panel', function(data) {
        console.log('RTA Panel online');
        panel = socket.id;
    })

    socket.on('init', function(online) {
        if (online) {
            console.log(online);
            console.log('Client init received');
            console.log('Emitting process to client');
            socket.emit('processUrl', {
                'loadUrl': 'http://www.tulandia.net/landing/LC6s9r?skipcookie=2'
            });
            //socket.emit('process', { 'loadUrl': 'http://www.tulandia.net/' });
        }
    })

    socket.on('processResponse', function(data) {
        console.log('processResponse Invoked: ' + JSON.stringify(data));
        socket.to(panel).emit('render', data);
    })

    socket.emit('ping', function() {
        console.log('PONG!');
    })
})


process.on('SIGINT', function() {
    doExit();
});
process.on('uncaughtException', function(err) {
    logger.error('uncaughtException: ' + err);
    doExit();
});

function doExit() {
    logger.error('Server shutdown unexpectedly');
    process.exit();
}