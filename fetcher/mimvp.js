'use strict'
const Crawler = require('crawler');
const Proxy   = require('../db/model').Proxy

const host       = 'http://proxy.mimvp.com';
let count        = 0;
let mimvpCrawler = new Crawler({
    rateLimit     : 2000,
    maxConnections: 1,
    jQuery        : 'cheerio',
    callback      : function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;
            if (!$) {
                console.warn('warning ' + res.request.uri.href + ' fetch error! page：' + page);
                process.exit(0);
            }
            let lines = $('tbody tr').each((index, tr) => {
                let columns = $(tr).find('td');
                let data    = {
                    source    : host,
                    ip        : $(columns[1]).text(),
                    protocol  : $(columns[2]).text(),
                    port      : $(columns[3]).text(),//需卷积运算
                    country   : $(columns[5]).text(),
                    validateAt: new Date($(columns[8]).text()),
                    createdAt : new Date()
                }
                console.dir(data);
            });

            done();
        }
    }
});

let page = 602;
mimvpCrawler.queue(host);


mimvpCrawler.on('drain', function (options) {
    console.log(`${host} proxy fetch done!`);
})