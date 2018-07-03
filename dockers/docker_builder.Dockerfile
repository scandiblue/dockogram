FROM docker:latest

CMD docker build \
-t $NAME_TAG \
--build-arg ARTIFACT_URL=$ARTIFACT_URL \
-
