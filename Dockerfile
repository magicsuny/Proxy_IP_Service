FROM node:latest
RUN mkdir /tmp/phantomjs \
    && curl -L https://cnpmjs.org/mirrors/phantomjs/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
           | tar -xj --strip-components=1 -C /tmp/phantomjs \
    && mv /tmp/phantomjs/bin/phantomjs /usr/bin \
    && rm -rf /tmp/phantomjs

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app/
RUN npm install
EXPOSE 8888
CMD [ "npm", "start" ]