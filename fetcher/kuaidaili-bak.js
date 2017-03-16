'use strict'
const Crawler = require('crawler');
const phantom = require('phantom');
const Proxy   = require('../db/model').Proxy;

let pageNum = 1;
const host  = 'http://www.kuaidaili.com';

let cookie = {};
phantom.create(['--ignore-ssl-errors=yes', '--load-images=yes']).then(instance => {
    return instance.createPage();
}).then(page => {
    return page.setting('javascriptEnabled').then(() => {
        return page.open(`${host}/free/inha/${pageNum}/`).then(() => {
            return page.evaluate(function () {
                var script      = document.getElementsByTagName('script')[0].innerText.replace('eval("qo=eval;qo(po);");', 'return po;');
                var startScript = script.slice(0, script.indexOf(';') + 1);
                startScript     = startScript.replace(' window.onload=setTimeout("', '');
                startScript     = startScript.replace('", 200);', '');
                script          = script.slice(script.indexOf(';') + 1, -1);
                script += startScript;
                return eval(script);
            }).then(function (result) {
                result           = result.replace('document.cookie=\'', '').replace('\'; window.document.location=document.URL', '');
                let results      = result.split(';');
                let _ydclearance = results[0].split('=')[1];
                let expires      = results[1].split('=')[1];
                let domain       = results[2].split('=')[1];
                let path         = results[3].split('=')[1];
                cookie           = {
                    'name'    : '_ydclearance', /* required property */
                    'value'   : _ydclearance, /* required property */
                    'domain'  : domain,
                    'path'    : path, /* required property */
                    'httponly': true,
                    'secure'  : false,
                    'expires' : expires   /* <-- expires in 1 hour */
                };
                console.dir(cookie);
                return cookie;
            });
        }).then(() => {
            return phantom.create(['--ignore-ssl-errors=yes', '--load-images=yes']);
        }).then(instance => {
            return instance.createPage();
        }).then(page => {
            page.addCookie(cookie);
            return page.setting('javascriptEnabled').then(() => {
                page.open(`${host}/free/inha/${pageNum}/`).then(() => {
                    page.evaluate(function () {
                        //return $('body').html();
                        var datas = '';
                        var lines = $('tbody tr')
                        for (var i = 0; i < lines.length; i++) {
                            var columns = $(lines[i]).find('td');
                            var line    = $(columns[0]).text() + ',' + $(columns[1]).text() + ',' + $(columns[2]).text() + ',' + $(columns[3]).text() + ',' + $(columns[4]).text() + ',' + $(columns[6]).text();
                            datas += line + ';';
                        }
                        return datas
                    }).then((proxys) => {
                        proxys    = proxys.slice(0, -1).split(';');
                        proxys.forEach((proxy) => {
                            let columns = proxy.split(',');
                            var data    = {
                                source    : host,
                                ip        : columns[0],
                                port      : columns[1],
                                proxyType : columns[2] == '高匿名' ? 'anonymous' : 'transparent',
                                protocol  : [columns[3]],
                                location  : columns[4],
                                validateAt: new Date(columns[6]),
                                createdAt : new Date()
                            };
                            //Proxy.create(data);
                            console.dir(data);
                        });
                        
                    }).catch(err => {
                        console.error(err);
                    })
                })
            })
        }).catch(err => {
            console.error(err);
        });

    })
}).catch(err => {
    console.error(err);
})