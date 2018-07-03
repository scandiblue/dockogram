FROM docker:latest

WORKDIR /app

CMD docker build \
-t $NAME_TAG \
--build-arg ARTIFACT_URL="$ARTIFACT_URL" \
--build-arg CACHEBURST=$(date +%s) \
-
