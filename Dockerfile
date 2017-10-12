# Start from scratch image and add in a precompiled binary
# docker build  --tag="earthcube/p418vocab:0.1.0"  .
# docker run -d -p 9900:9900  earthcube/p418vocab:0.1.0
FROM scratch

# Add in the static elements (could also mount these from local filesystem)
# later as the indexes grow
ADD p418Vocabulary /
ADD ./html/ ./html

# Add our binary
CMD ["/p418Vocabulary"]

# Document that the service listens on this port
EXPOSE 9900
