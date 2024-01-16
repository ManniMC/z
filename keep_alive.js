var http = require('http');
http.createServer(function (req, res) {
  res.write("I'm alive");
  res.end();
}).listen(8080);



In the main file (index.js) add:
const keep_alive = require('./keep_alive.js')