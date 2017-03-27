'use strict'
const phantom    = require('phantom');
const Bottleneck = require("bottleneck");
const validator  = require('../validator');

const host = 'http://www.xicidaili.com';
let count  = 0;

let page;
phantom.create(['--ignore-ssl-errors=yes', '--load-images=yes']).then(instance => {
    return instance.createPage();
}).then(p => {
    page = p;
}).catch(err => {
    console.error(err);
});

function fetchIps(pageNum) {
    let url = `${host}/nn/${pageNum}/`;
    return page.setting('javascriptEnabled').then(() => {
        return page.open(url)
    }).then(status => {
        return page.includeJs('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js');
    }).then((status) => {
        console.log(url + ' fetched!');
        return page.evaluate(function () {
            var lines = jQuery('#ip_list tbody tr');
            var datas = [];
            for (var i = 0; i < lines.length; i++) {
                var columns = jQuery(lines[i]).find('td');
                var data    = {
                    ip       : jQuery(columns[1]).text(),
                    port     : jQuery(columns[2]).text(),
                    proxyType: jQuery(columns[4]).text(),
                    protocol : jQuery(columns[5]).text(),
                    location : jQuery(columns[3]).text()
                }
                if (data.ip) {
                    datas.push(data);
                }
            }
            return JSON.stringify(datas);
        });
    }).then((proxys) => {
        proxys = JSON.parse(proxys);
        proxys.forEach((proxy) => {
            var data = {
                source    : host,
                ip        : proxy.ip,
                port      : proxy.port,
                proxyType : proxy.proxyType == '高匿' ? 'anonymous' : 'transparent',
                protocol  : [proxy.protocol],
                location  : proxy.location,
                isValid   : false,
                validateAt: null,
                createdAt : new Date()
            };
            validator.push2ProxyTestPool(data);
        });
    });
}


exports.start = function () {
    let bn = new Bottleneck(2, 1000);
    setTimeout(function () {
        for (let i = 1; i < 1531; i++) {
            bn.schedule(fetchIps, i);
        }
    }, 1000);
}