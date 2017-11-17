// Require express and socket.io
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var config = require('./config');

// They object that will hold information about the active users currently on the site
var visitorsData = {};

app.set('port', (process.env.PORT || 5000));

// Serve the static assets from the public directory
app.use(express.static(path.join(__dirname, '/public')));

// Serve the index.html page when someone visit any of the following endpoints
app.get(/\/(about|contact)?$/, function (req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Serve up the dashboard when someone visit /dashboard
app.get('/dashboard', function (req, res) {
    res.sendFile(path.join(__dirname, '/views/dashboard.html'));
});

io.on('connection', function  (socket) {
    if (
        socket.handshake.headers.host === config.host &&
        socket.handshake.headers.referer.indexOf(
            config.host + config.dashboardEndpoint
        ) > -1
    ) {
        // If someone visits '/dashboard' send them the computed visitor data
        io.emit('updated-stats', computeStats());
    }

    socket.on('visitor-data', function(data) {
        // A user has visited our page - add them to the visitorsData object
        visitorsData[socket.id] = data;

        // Compute and send visitor data to the dashboard when a new user visits our page
        io.emit('updated-status', computeStats());
    });

    socket.on('disconnect', function() {
        // A user has left our page - remove them from the visitorsData object
        delete visitorsData[socket.id];

        io.emit('updated-status', computeStats())   ;
    });
});

// Wrapper function to compute the stats and return a object with the updated stats
function computeStats() {
    return {
        pages: computePageCounts(),
        referrers: computeRefererCounts(),
        activeUsers: getActiveUsers()
    };
}

// get the total number of users on each page of our site
function computePageCounts() {
    // sample data in pageCounts object
    var pageCounts = {};
    for (var key in visitorsData) {
        var page = visitorsData[key].page;
        if (page in pageCounts) {
            pageCounts[page]++;
        } else {
            pageCounts[page] = 1;
        }
    }
    return pageCounts;
}

// Get the total number of users per referring site
function computeRefererCounts() {
    // Sample data in referrerCounts object
    var referrerCounts = {};
    for (var key in visitorsData) {
        var referringSite = visitorsData[key].referringSite || '(direct)';
        if (referringSite in referrerCounts) {
            referrerCounts[referringSite]++;
        } else {
            referrerCounts[referringSite] = 1;
        }
    }
    return referrerCounts;
}

// Get the total active users on our site
function getActiveUsers() {
    return Object.keys(visitorsData).length;
}

http.listen(app.get('port'), function () {
    console.log('listening on *:' + app.get('port'));
});