/**
 * Created by sunyao on 2017/3/7.
 */
const Koa    = require('koa');
const router = require('koa-router')();
const app    = new Koa();
const Proxy  = require('../db/model').Proxy;
// x-response-time

app.use(async function (ctx, next) {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

// logger
app.use(async function (ctx, next) {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});

router.get('/proxy', async(ctx, next) => {
    let result = await Proxy.findOne({isValid: true}).then((result) => {
        if(!result){
            ctx.status=404;
            return '';
        }
        let protocol = result.protocol[0];
        let ip       = result.ip;
        let port     = result.port;
        let proxy    = `${protocol}://${ip}:${port}`;
        return proxy;
    })
    ctx.body = result;
})
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);