FROM mhart/alpine-node:8.11.1

RUN apk add --no-cache git

WORKDIR /app

ARG CACHEBURST=1
RUN git clone --depth=1 https://github.com/scandiblue/dockogram.git .

RUN yarn --production true


FROM mhart/alpine-node:base-8.11.1

RUN apk add --no-cache docker

WORKDIR /app

# copy .env from tar archive sent to dockogram
COPY ./.env /app/.env

COPY --from=0 /app/src src/
COPY --from=0 /app/node_modules node_modules/


CMD node src/index.js
