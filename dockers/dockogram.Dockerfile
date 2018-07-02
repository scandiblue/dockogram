FROM mhart/alpine-node:8.11.1

RUN apk add --no-cache git

WORKDIR /app

RUN git clone --depth=1 https://github.com/scandiblue/dockogram.git .

RUN yarn --production true


FROM mhart/alpine-node:base-8.11.1

WORKDIR /app

COPY --from=0 /app/index.js index.js
COPY --from=0 /app/node_modules node_modules/

CMD node index.js
