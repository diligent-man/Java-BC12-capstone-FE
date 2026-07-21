ARG NODE_VERSION=${NODE_VERSION:-26.1.0}
ARG DEBIAN_FRONTEND=noninteractive

FROM node:$NODE_VERSION-trixie

WORKDIR /my_app

COPY  ./src ./src
COPY  ./public ./public
COPY *.html ./package.json ./vite.config.js ./
COPY entrypoint.sh ./

RUN chmod +x ./entrypoint.sh

WORKDIR /

EXPOSE 3979
ENTRYPOINT ["/usr/bin/sh", "/my_app/entrypoint.sh"]
