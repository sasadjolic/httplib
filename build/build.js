// Dependencies
var exec = require('child_process').exec;
var fs = require('fs-extra');
var seq = require('seq');

// Do the build.
var build = {};
seq()
	.seq(function () {
		// Read in the project version.
		fs.readFile('VERSION', 'ascii', this);
	})
	.seq(function(version) {
		// Save the version number for later.
		build.version = '' + version;

		// Copy raw JS, if required.
		fs.copySync('lib/http.js', 'dist/http-' + build.version + '.js');

		// Minify JS.
		exec('java -jar build/closure/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js lib/http.js --js_output_file dist/http-' + build.version + '.min.js', this);

		// Alternatively, use jsmin. It doesn't compress as much as the closure compiler.
		/*
		var jsmin = require('jsmin').jsmin;
		var minified = jsmin(css, 3);
		*/
	});
