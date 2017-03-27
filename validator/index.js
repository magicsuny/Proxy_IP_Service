const exec     = require('child_process').exec;
const config   = require('../profile/config');
const Proxy    = require('../db/model').Proxy;
const kue      = require('kue');
const mongoose = require('mongoose');
const storage  = require('../storage');
const ObjectId = mongoose.Types.ObjectId;

const queue = kue.createQueue({
    prefix   : 'proxy:tester',
    jobEvents: false,
    redis    : {
        port: config.redisConfig.port,
        host: config.redisConfig.host,
        db  : config.redisConfig.db
    }
});

queue.process('proxy:test', function (job, done) {
    console.log('Processing job ' + job.id);
    let protocol = job.data.protocol;
    let ip       = job.data.ip;
    let port     = job.data.port;
    return testProxy(protocol, ip, port).then((result) => {
        job.data.validateAt = new Date();
        storage.push2StoragePool(job.data);
        return done();
    }).catch((err) => {
        console.error(`${protocol}://${ip}:${port} is invalid! drop Now!`);
        done();
    })
});

queue.on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
        if (err) return;
        job.remove(function (err) {
            if (err) throw err;
            console.log('removed completed job #%d', job.id);
        });
    });
}).on('job failed', function (id, result) {
    kue.Job.get(id, function (err, job) {
        if (err) return;
        job.remove(function (err) {
            if (err) throw err;
            console.log('removed faild job #%d', job.id);
        });
    });
});


function testProxy(protocol, proxyIp, proxyPort) {
    let command = `curl –connect-timeout 2 -m 1 -x ${protocol}://${proxyIp}:${proxyPort} "http://ip.cn"`;
    return new Promise(function (resolve, reject) {
        console.log(command);
        let child = exec(command, function (error, stdout, stderr) {
            if (error) {
                return reject(error);
            }
            let ip = stdout.match(/\d+\.\d+\.\d+\.\d+/);
            if (ip[0] === proxyIp) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    })
}

/**
 * @param proxyData
 * @param proxyData.ip
 * @param proxyData.protocol
 * @param proxyData.port
 */
exports.push2ProxyTestPool = function (proxyData) {
    queue.createJob('proxy:test', jobData).delay(200).removeOnComplete(true).save();
}
//
// function queryProxys(page, limit) {
//     Proxy.find({isValid: false}).limit(limit).skip(page * limit).then((result) => {
//         if (!Array.isArray(result) || result.length == 0) {
//             console.log('All proxy test over!');
//             return;
//         }
//         result.forEach((item) => {
//             let protocol = item.protocol[0];
//             let ip       = item.ip;
//             let port     = item.port;
//             let jobData  = {recordId: result._id, protocol: protocol, ip: ip, port: port};
//             let job      = queue.createJob('proxy:test',jobData).delay(200).removeOnComplete(true).save();
//         });
//         setTimeout(function () {
//             queryProxys(page + 1, limit)
//         }, 1000);
//     }).catch(err => {
//         console.error(err);
//     });
// }
//
// //
// exports.start = function(){
//     queryProxys(1, 10);
// }