FROM mhart/alpine-node:8.11.1

RUN apk add --no-cache git

WORKDIR /app

COPY . ./

RUN yarn --production true


FROM mhart/alpine-node:base-8.11.1

RUN apk add --no-cache docker

WORKDIR /app

COPY .env /app/.env
COPY --from=0 /app/src src/
COPY --from=0 /app/node_modules node_modules/


CMD node src/index.js
