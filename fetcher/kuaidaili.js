'use strict'
const Crawler    = require('crawler');
const phantom    = require('phantom');
const Bottleneck = require("bottleneck");
const Proxy      = require('../db/model').Proxy;

const host = 'http://www.kuaidaili.com';

let page = null;


phantom.create(['--ignore-ssl-errors=yes', '--load-images=yes']).then(instance => {
    return instance.createPage();
}).then(p => {
    page = p;
    p.on('onResourceRequested', true, function (requestData, networkRequest) {
        //console.debug(requestData.url)
    });
}).catch(err => {
    console.error(err);
});


function fetchIps(pageNum) {
    let url = `${host}/free/inha/${pageNum}/`;
    return page.setting('javascriptEnabled').then(() => {
        return page.open(url)
    })
    //     .then((status) => {
    //     console.log(status);
    //     return page.evaluate(function () {
    //         var script      = document.getElementsByTagName('script')[0].innerText.replace('eval("qo=eval;qo(po);");', 'eval(po);return po;');
    //         var startScript = script.slice(0, script.indexOf(';') + 1);
    //         startScript     = startScript.replace(' window.onload=setTimeout("', '');
    //         startScript     = startScript.replace('", 200);', '');
    //         script          = script.slice(script.indexOf(';') + 1, -1);
    //         script += startScript;
    //         return eval(script);
    //     });
    // }).then(() => {
    //     return new Promise(function (resolve, reject) {
    //         setTimeout(function () {
    //             page.open(`${host}/free/inha/${pageNum}/`).then(resolve)
    //         }, 1000);
    //     })
    //     //return page.open(`${host}/free/inha/${pageNum}/`);
    // })
        .then((status) => {
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
                    }).then(resolve);
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
                Proxy.create(data, function (err, result) {
                    if (err) console.log(err);

                });

            });
        });
}

exports.start = function () {
    let bn = new Bottleneck(2, 1000);
    setTimeout(function () {
        for (let i = 1; i < 1536; i++) {
            bn.schedule(fetchIps, i);
        }
    }, 1000);
}

