FROM mhart/alpine-node:8.11.1

RUN apk add --no-cache git

WORKDIR /app

RUN git clone --depth=1 https://github.com/scandiblue/dockogram.git .

RUN yarn --production true


FROM mhart/alpine-node:base-8.11.1

WORKDIR /app

COPY .env /app/.env
COPY --from=0 /app/src src/
COPY --from=0 /app/node_modules node_modules/


CMD node src/index.js
