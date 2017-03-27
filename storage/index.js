const Proxy       = require('../db/model').Proxy;
const kue         = require('kue');
const config      = require('../profile/config');
const mongoose    = require('mongoose');
const ObjectId    = mongoose.Types.ObjectId;
const queuePrefix = 'proxy:storage';

const queue = kue.createQueue({
    prefix   : queuePrefix,
    jobEvents: false,
    redis    : {
        port: config.redisConfig.port,
        host: config.redisConfig.host,
        db  : config.redisConfig.db
    }
});

queue.process(queuePrefix, function (job, done) {
    console.log('Processing job ' + job.id);
    var data = {
        source    : job.data.source,
        ip        : job.data.ip,
        port      : job.data.port,
        proxyType : job.data.proxyType,
        protocol  : job.data.protocol,
        location  : job.data.location,
        isValid   : true,
        validateAt: job.data.validateAt,
        createdAt : new Date()
    };
    Proxy.create(data, function (err, result) {
        if (err) {
            console.log(err);
            return done(err);
        }
        return done();
    });
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

exports.push2StoragePool = function(data){
    queue.createJob(queuePrefix, data).removeOnComplete(true).save();
}