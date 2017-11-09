package main

import (
  "log"
  "strings"
  "net/http"

  "github.com/gorilla/mux"
)

// MyServer struct for mux router
type MyServer struct {
  r *mux.Router
}

func main() {

  htmlRouter := mux.NewRouter().StrictSlash(true)
  htmlRouter.HandleFunc("/voc/diagram", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/diagram.html")
  })
  htmlRouter.HandleFunc("/voc/examples", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/examples.html")
  })
  htmlRouter.HandleFunc("/voc/examples/minimal", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/static/schema/examples/required.jsonld")
  })
  htmlRouter.HandleFunc("/voc/examples/full", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/static/schema/examples/full.jsonld")
  })
  htmlRouter.HandleFunc("/voc/schema", Conneg)
  htmlRouter.HandleFunc("/voc/schema.{ext}", Conneg)
  htmlRouter.PathPrefix("/voc/static").Handler(http.StripPrefix("/voc/static", http.FileServer(http.Dir("./html/voc/static"))))
  htmlRouter.HandleFunc("/voc/", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/index.html")
  })
  htmlRouter.HandleFunc("/voc/{resource}", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./html/voc/index.html")
  })
  http.Handle("/", &MyServer{htmlRouter})

  err := http.ListenAndServe(":9900", nil)
  // http 2.0 http.ListenAndServeTLS(":443", "server.crt", "server.key", nil)
  if err != nil {
    log.Fatal(err)
  }
}

func (s *MyServer) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
  rw.Header().Set("Access-Control-Allow-Origin", "*")
  rw.Header().Set("Access-Control-Allow-Methods", "POST, GET")
  rw.Header().Set("Access-Control-Allow-Headers",
    "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

  // Let the Gorilla work
  s.r.ServeHTTP(rw, req)
}

func addDefaultHeaders(fn http.HandlerFunc) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    fn(w, r)
  }
}

// Conneg handles content negotiation for RDF requests
func Conneg(w http.ResponseWriter, r *http.Request) {
  vars := mux.Vars(r)
  fileExtension := vars["ext"]

  //log.Printf("File Extension: '" + fileExtension + "'")
  switch fileExtension {
    case "owl":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.owl")
      break
    case "rdf":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.owl")
      break
    case "xml":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.owl")
      break
    case "ttl":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.ttl")
      break
    case "n3":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.n3")
      break
    case "json":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.jsonld")
      break
    case "jsonld":
      http.ServeFile(w, r, "./html/voc/static/schema/schema.jsonld")
      break
    default:
      // Check for Accept header
      accept := r.Header.Get("Accept")
      //log.Printf("Accept: '" + accept + "'")
      switch {
        case CaseInsensitiveContains(accept, "application/rdf+xml"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.owl")
          break
        case CaseInsensitiveContains(accept, "application/xml"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.owl")
          break
        case CaseInsensitiveContains(accept, "application/rdf+turtle"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.ttl")
          break
        case CaseInsensitiveContains(accept, "application/rdf+n3"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.n3")
          break
        case CaseInsensitiveContains(accept, "application/json"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.jsonld")
          break
        case CaseInsensitiveContains(accept, "application/ld+json"):
          http.ServeFile(w, r, "./html/voc/static/schema/schema.jsonld")
          break
        default:
          http.ServeFile(w, r, "./html/voc/static/schema/schema.jsonld")
          break
      }
  }
}

func CaseInsensitiveContains(s, substr string) bool {
    s, substr = strings.ToUpper(s), strings.ToUpper(substr)
    return strings.Contains(s, substr)
}

