# Start from scratch image and add in a precompiled binary
# docker build --tag="earthcube/p418vocab:latest" --tag="earthcube/p418vocab:" .
# docker run -d -p 9900:9900  earthcube/p418vocab:latest
# docker save earthcube/p418vocab:latest | bzip2 | ssh root@geodex.org 'bunzip2 | docker load'
FROM scratch

# Add in the static elements (could also mount these from local filesystem)
# later as the indexes grow
ADD p418Vocabulary /
ADD ./html/ ./html

# Add our binary
CMD ["/p418Vocabulary"]

# Document that the service listens on this port
EXPOSE 9900
