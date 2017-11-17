var socket = io();

var vm = new Vue({
    el: '#app',
    data: {
        pages: {},
        referrers: {},
        activeUsers: 0
    },
    created: function () {
        socket.on('updated-status', function (data) {
            this.pages = data.pages;
            this.referrers = data.referrers;
            this.activeUsers = data.activeUsers;
        }.bind(this));
    }
});