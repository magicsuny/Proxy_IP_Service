const schedule = require('node-schedule');
const tester   = require('./validator/tester');
const fetcher  = require('./fetcher');

schedule.scheduleJob('* * */3 * *', function () {
    tester.start();
});

fetcher.start();