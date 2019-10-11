let {compile} = require('./meta3')
let {readFileSync,writeFileSync} = require('fs')
let input = readFileSync('js.meta','utf8')
let output = compile(input)
writeFileSync('meta4.js',output)


