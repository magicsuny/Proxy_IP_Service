const mongoose = require('mongoose');
const config   = require('../profile/config')
const Schema   = mongoose.Schema;

mongoose.connect(config.mongodbConfig.connectUrl,
    {
        db    : {native_parser: true},
        server: {
            poolSize      : 5,
            auto_reconnect: true,
            socketOptions : {
                keepAlive: 1
            }
        },
        //replset: { rs_name: 'myReplicaSetName' },
        user  : 'root',
        pass  : ''
    });

mongoose.set('debug', false);
const proxySchema = new Schema({
    ip        : String,
    port      : String,
    source    : String,
    validateAt: Date,
    protocol  : [String],
    proxyType : String,
    location  : String,
    useTimes  : Number,
    isValid   : Boolean,
    createdAt : Date
}, {collection: 'proxy'});

proxySchema.index({validateAt: -1}, {background: true});

exports.Proxy = mongoose.model('proxy', proxySchema);