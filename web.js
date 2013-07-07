var fs = require('fs');
var data = fs.readFileSync('index.html');
console.log(data.toString());
