const kuaidaili = require('./kuaidaili.js');
const xicidaili = require('./xicidaili.js');
const schedule  = require('node-schedule');


schedule.scheduleJob('* * */12 * *', function(){
    kuaidaili.start();
    xicidaili.start();
});