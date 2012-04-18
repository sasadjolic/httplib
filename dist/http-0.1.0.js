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

		var merge = function(dst, src) {
			for (prop in src) {
				if (typeof src[prop] == 'object') { merge(dst[prop], src[prop]); continue; }
				dst[prop] = src[prop];
			}
		}

		var sizeof = function(obj) {
			var size = 0;
			if (typeof obj === 'boolean') {
				size = 4;
			}
			else if (typeof obj === 'string') {
				size = obj.length * 2;
			}
			else if (typeof obj === 'number') {
				size = 8;
			}
			else if (typeof obj === 'object') {
				for (i in obj) {
					size += 8; // An assumed existence overhead
					size += sizeof(obj[i]);
				}
			}
			return size;
		}

		// Cache.
		var _cache = {
			size: 0,
			items: []
		};

		var cached = function(method, url, headers, body) {
			var key = method + ' ' + url;
			var item = _cache.items[key];

			// Evict expired items from the cache.
			if (item && item.response.expires && item.response.expires.getTime() - new Date().getTime() <= 0) {
				_cache.size -= item.size;
				_cache.items.splice(_cache.items.indexOf(key), 1);
				item = null;
			}

			return item;
		}

		var cache = function(method, url, headers, body, response) {
			// Fill out the item to cache.
			var item = {
				request: {
					method: method,
					url: url,
					headers: headers,
					body: body
				},
				response: response
			};

			// Calculate item size.
			item.size = sizeof(item);

			// Evict items from cache if not enough space in the cache.
			while (_cache.length && _cache.size + item.size > HTTP._options.cache.size) {
				_cache.size -= _cache.items[_cache.length - 1].size;
				_cache.items.splice(-1, 1);
			}

			// Store item into the cache.
			if (_cache.size + item.size <= HTTP._options.cache.size) {
				var key = method + ' ' + url;
				_cache.items[key] = item;
				_cache.size += item.size;
			}
		}

		var expires = function(xhr) {
			// Parse the cache-control header.
			var cacheControl = xhr.getResponseHeader('cache-control');
			if (cacheControl) {
				// No cache.
				if (cacheControl.indexOf('no-cache') > -1) return '';

				// Set expiry date based on max age.
				var match = cacheControl.match(/max-?age\s*=\s*(\d+)/);
				if (match && match[1] > 0) {
					var maxage = match[1];
					var expiryDate = new Date();
					expiryDate.setTime(expiryDate.getTime() + maxage * 1000);
					return expiryDate;
				}
			}

			// Set expiry date based on 'expires' header.
			var expiryDate = xhr.getResponseHeader('expires');
			if (expiryDate) return new Date(expiryDate);

			// No cache expiry provided in the response. Because caching is not
			// explicitly forbidden, cache the response for a default amount of time.
			expiryDate = new Date();
			expiryDate.setTime(expiryDate.getTime() + HTTP._options.cache.age);
			return expiryDate;
		}

		// Singleton instance.
		var instance = null;

		var HTTP = function() {
			// Prevent multiple instances from being created.
			if (instance !== null) {
				throw new Error("Can't instantiate more than one HTTP instance");
			}
		}

		var setOptions = function(options) {
			// Merge given options with defaults.
			merge(HTTP._options, options);

			// Return the merged options.
			return HTTP._options;
		}

		var request = function(method, url, headers, body, cb) {
			// Let's see if the response to this request is available in the cache.
			var item = cached(method, url, headers, body);
			if (item) {
				// Notify user of the response.
				cb(null, item.response.status, item.response.headers, item.response.body);

				// No need to do anything else.
				return;
			}

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
				response.headers = (xhr.getAllResponseHeaders() || '').trim().split('\n');
				response.expires = expires(xhr);
				//response.etag = (xhr.getResponseHeader('etag') || '').trim();

				if (response.status > 0) {
					// Cache the response.
					cache(method, url, headers, body, response);

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
			}, HTTP._options.timeout);

			// Initiate the request.
			xhr.send(body);
		}

		HTTP.prototype = {
			request: request,
			options: setOptions
		};

		// Set defaults.
		HTTP._options = {
			cache: {
				enabled: false,
				methods: ['GET'],
				age: 24 * 60 * 60 * 1000, // 24hrs in milliseconds
				size: 100 * 1024 * 1024 // 100MB in bytes
			},
			log: false,
			timeout: 60 * 1000 // 60 seconds (in milliseconds)
		}

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
