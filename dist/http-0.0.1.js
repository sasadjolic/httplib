(function (define) {
	define('HTTP', [], function() {

		if (typeof window === 'undefined') window = {};

		var XHR = function() {
			if (typeof XMLHttpRequest != 'undefined') {
				return new XMLHttpRequest();
			}
			try {
				return new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch (e) {
				try {
					return new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch (e) {}
			}
			return false;
		}

		// Singleton instance.
		var instance = null;

		var HTTP = function() {
			// Prevent multiple instances from being created.
			if (instance !== null) {
				throw new Error("Can't instantiate more than one HTTP instance");
			}

			// Set defaults.
			this.timeout = 60 * 1000; // 60 seconds
		}

		var request = function(method, url, headers, body, cb) {
			// Prepare and send the request.
			var xhr = XHR();
			xhr.open(method, url, true);
			for (var header in headers) {
				var value = headers[header];
				xhr.setRequestHeader(header, value);
			}

			// Configure a callback for the asynchronous XHR call.
			xhr.onreadystatechange = function() {
				// Wait until the full response is received.
				if (xhr.readyState != 4)  { return; }

				// Cancel the timeout timer.
				clearTimeout(timer);

				// Parse the response.
				var response = {};
				response.status = xhr.status;
				response.body = xhr.responseText;
				response.headers = xhr.getAllResponseHeaders().trim().split('\n');

				if (response.status > 0) {
					// Notify user of the response.
					cb(null, response.status, response.headers, response.body);
				}
				else {
					// Notify user of the error.
					cb(new Error("XMLHTTPRequest error"));
				}
			};

			// Configure a timeout timer.
			var timer = setTimeout(function() {
				// Abort the asynchronous XHR call.
				// NOTE: This will result in a readystatechange event to be fired
				//       with status set to 0.
				xhr.abort();
			}, this.timeout);

			// Initiate the request.
			xhr.send(body);
		}

		HTTP.prototype = {
			request: request
		};

		var sharedInstance = function() {
			if (instance === null) {
				instance = new HTTP();
			}
			return instance;
		};

		// Return the singleton.
		return sharedInstance();
	});
}(typeof define === 'function' && define.amd ? define : function(name, deps, factory) {
	// node.js
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require);
	}

	// require.js
	else if (typeof require === 'function') {
		window['HTTP'] = factory(function(value) {
			return window[value];
		});
	}

	// web browsers
	else {
		window['HTTP'] = factory();
	}
}));
