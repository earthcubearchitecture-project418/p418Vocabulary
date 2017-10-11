FROM golang:1.9

WORKDIR /go/src/app
ADD ./server.go .
ADD ./html/ ./html

RUN go-wrapper download   # "go get -d -v ./..."
RUN go-wrapper install    # "go install -v ./..."

CMD ["go-wrapper", "run"] # ["app"]
