FROM docker:latest

WORKDIR /app

COPY . ./
COPY ./local.env ./.env
COPY ./local.env ./local.env

CMD docker build \
-t $NAME_TAG \
--build-arg ARTIFACT_URL="$ARTIFACT_URL" \
--build-arg CACHEBURST=$(date +%s) \
-f- .
