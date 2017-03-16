const exec     = require('child_process').exec;
const Proxy    = require('../db/model').Proxy;
const kue    = require('kue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const queue = kue.createQueue({
    prefix   : 'proxy:tester',
    jobEvents: false,
    redis    : {
        port: 6379,
        host: '192.168.99.100',
        db  : 1
    }
});

queue.process('proxy:test', function(job,done){
    console.log('Processing job ' + job.id);
    let protocol = job.data.protocol;
    let ip       = job.data.ip;
    let port     = job.data.port;
    return testProxy(protocol, ip, port).then((result) => {
        return Proxy.update({_id: ObjectId(job.data.recordId)}, {
            $set: {
                validateAt: new Date(),
                isValid   : true
            }
        })
    }).then(function () {
        return done();
    }).catch(() => {
        console.error(`${protocol}://${ip}:${port} is invalid! drop Now!`);
        done();
        return Proxy.update({_id: ObjectId(job.data.recordId)}, {
            $set: {
                validateAt: new Date(),
                isValid   : false
            }
        })
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

function queryProxys(page, limit) {
    Proxy.find({isValid: false}).limit(limit).skip(page * limit).then((result) => {
        if (!Array.isArray(result) || result.length == 0) {
            console.log('All proxy test over!');
            return;
        }
        result.forEach((item) => {
            let protocol = item.protocol[0];
            let ip       = item.ip;
            let port     = item.port;
            let jobData  = {recordId: result._id, protocol: protocol, ip: ip, port: port};
            let job      = queue.createJob('proxy:test',jobData).delay(200).removeOnComplete(true).save();
        });
        setTimeout(function () {
            queryProxys(page + 1, limit)
        }, 1000);
    }).catch(err => {
        console.error(err);
    });
}

//
exports.start = function(){
    queryProxys(1, 10);
}