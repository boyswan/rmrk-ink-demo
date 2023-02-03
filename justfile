run NAME:
  node script/{{NAME}}.mjs

build NAME:
  cargo +nightly contract build --offline --manifest-path ./contracts/{{NAME}}/Cargo.toml

cp-metadata NAME PATH:
  cp ./target/ink/{{NAME}}/metadata.json {{PATH}}/{{NAME}}.json

build-all: 
  just build game
  just build body
  just build item

cp-metadata-all PATH: 
  just cp-metadata game {{PATH}} 
  just cp-metadata body {{PATH}}
  just cp-metadata item {{PATH}}

finalize:
  @curl -s -o /dev/null http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d '{ "jsonrpc":"2.0", "id":1, "method":"engine_createBlock", "params": [true, true, null] }'
  @echo Finalized block

finalize-auto:
  just run auto_finalize
  @echo Running auto-finalize 

