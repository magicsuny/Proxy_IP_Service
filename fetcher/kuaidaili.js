'use strict'
const Crawler    = require('crawler');
const phantom    = require('phantom');
const Bottleneck = require("bottleneck");
const validator  = require('../validator');

const host = 'http://www.kuaidaili.com';


function fetchIps(pageNum) {
    let url = `${host}/free/inha/${pageNum}/`;
    console.log('fetching kuaidaili url:' + url);
    let instance, page;
    return phantom.create(['--ignore-ssl-errors=yes', '--load-images=yes']).then(i => {
        instance = i;
        return instance.createPage();
    }).then(p => {
        page = p;
        return page.setting('javascriptEnabled').then(() => {
            return page.open(url).then((status)=>{
                if (status === 'fail') {
                    console.warn('[' + host + '] openurl:' + url + ' status:' + status);
                }
                return
                //return page.includeJs('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js');
            })
        })
    }).then(() => {
        console.log(url + ' fetched!');
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                page.evaluate(function () {
                    //return document.body.innerText;
                    var datas = '';
                    var lines = $('tbody tr');
                    for (var i = 0; i < lines.length; i++) {
                        var columns = $(lines[i]).find('td');
                        var line    = $(columns[0]).text() + ',' + $(columns[1]).text() + ',' + $(columns[2]).text() + ',' + $(columns[3]).text() + ',' + $(columns[4]).text() + ',' + $(columns[6]).text();
                        datas += line + ';';
                    }
                    return datas;
                }).then((result)=>{
                    resolve(result);
                })

            }, 1500);
        })
    }).then((proxys) => {
        proxys = proxys.slice(0, -1).split(';');
        proxys.forEach((proxy) => {
            let columns = proxy.split(',');
            var data    = {
                source    : host,
                ip        : columns[0],
                port      : columns[1],
                proxyType : columns[2] == '高匿名' ? 'anonymous' : 'transparent',
                protocol  : [columns[3]],
                location  : columns[4],
                isValid   : false,
                validateAt: null,
                createdAt : new Date()
            };
            validator.push2ProxyTestPool(data);
        });
    }).then(() => {
        return instance.exit();
    }).catch(err => {
        console.error(err);
        return instance.kill();
    })


}

exports.start = function () {
    let bn = new Bottleneck(3, 1000);
    for (let i = 1; i < 1536; i++) {
        bn.schedule(fetchIps, i);
    }
}