const schedule = require('node-schedule');
const tester   = require('./validator/tester');
const fetcher  = require('./fetcher');
const api      = require('./api/app.js');

schedule.scheduleJob('* * */3 * *', function () {
    tester.start();
});

fetcher.start();