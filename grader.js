#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var restler = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var URL_DEFAULT = "http://localhost/index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile, cb) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }

    cb();
};

var assertUriExists = function(url, cb) {
    var instr = url.toString();
    restler.get(instr).once('complete', function(result) {
	if (result instanceof Error) {
	    console.log("%s does not exist. Exiting.", instr);
	    process.exit(1);
	} 

	cb();
    });
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, cb) {
    if(htmlfile.indexOf('http')==0) {
	restler.get(htmlfile).once('complete', function(data) {
	    $ = cheerio.load(data);
	    var checks = loadChecks(checksfile).sort();
	    var out = {};
	    for(var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	    }
	    
	    cb(out);
	});
    } else {
	fs.readFile(htmlfile, function(err, data) {
	    $ = cheerio.load(data);
	    var checks = loadChecks(checksfile).sort();
	    var out = {};
	    for(var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	    }
	    cb(out);
	});
    }
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Url to index.html')
        .parse(process.argv);

    assertFileExists(program.checks, function() {
	if(program.url) {
	    assertUriExists(program.url, function() {
		checkHtmlFile(program.url, program.checks, function(result) {
		    var outJson = JSON.stringify(result, null, 4);
		    console.log(outJson);
		});
	    });
	} else {
	    assertFileExists(program.file, function() {
		checkHtmlFile(program.url || program.file, program.checks, function(result) {
		    var outJson = JSON.stringify(result, null, 4);
		    console.log(outJson);
		});
	    });
	}
    });
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
