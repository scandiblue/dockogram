FROM docker:latest

COPY ./test.sh /scripts/test.sh

CMD /bin/sh /scripts/test.sh
