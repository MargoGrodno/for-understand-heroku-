var http = require('http');
var url = require('url');
var getIp = require('./getIp');
var historyMod = require('./history');
var ratesService = require('./ratesService');

var history = new historyMod.History();
var toBeResponded = [];
var ip = getIp();

var startTime = curentDateTime();

var errStatusMap = {
    "Deleting non-existent message": 422,
    "Rollback non-existent message": 422,
    "Edit non-existent message": 422,
    "Nothing for rollback": 422,
    "Unsuported operation": 400,
    "Wrong token format": 422,
    "Wrong token": 422,
    "Unsuported http request": 501,
    "Bad Request": 400
}

var server = http.createServer(function(req, res) {
    console.log('method: ' + req.method + ", " + req.url);

    if (req.method != "GET") {
        responseWith(res, Error("Unsuported http request"));
    }

    getHandler(req, res, function(err) {
        responseWith(res, err);
    });
});

function responseWith(response, body) {
    if (body instanceof Error) {
        responseWithError(response, body);
        return;
    }

    var statusCode = 200;
    response.writeHeader(statusCode, {
        'Access-Control-Allow-Origin': '*'
    });
    if (body) {
        response.write(JSON.stringify(body));
    }
    response.end();
}

function responseWithError(response, err) {
    var statusCode = errStatusMap[err.message];
    if (statusCode == undefined) {
        statusCode = 400;
    }

    response.writeHeader(statusCode, {
        'Access-Control-Allow-Origin': '*'
    });
    response.write(JSON.stringify(err.message));
    response.end();
}

function getHandler(req, res, continueWith) {
    var urlToken = getUrlToken(req.url);

    if (req.url == "/") {
        continueWith({
            status: "Running",
            startTime: startTime
        });
        return;
    }

    if (urlToken == undefined) {
        continueWith(Error("Bad Request"));
        return;
    }
}

function getUrlToken(u) {
    var parts = url.parse(u, true);
    return parts.query.token;
}

function getHourMinutes(utcNumberDate) {
    var date = new Date(utcNumberDate);
    var hour = date.getHours();
    var min = date.getMinutes();
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    return hour + ":" + min;
}

function curentDateTime() {
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/" +
        (currentdate.getMonth() + 1) + "/" +
        currentdate.getFullYear() + " @ " +
        currentdate.getHours() + ":" +
        currentdate.getMinutes() + ":" +
        currentdate.getSeconds();
    return datetime;
}

function startServer(port) {
    server.listen(port, ip);
    server.setTimeout(0);
    console.log('Server running at http://' + ip + ':' + port);
}

module.exports = {
    startServer: startServer
};