QUnit.module('HTTP');

QUnit.test('HTTP.request', function () {
	var method = 'GET';
	var url = 'https://api.github.com/gists/public';
	var headers = {'Accept': 'application/json'};
	var body = '';
	HTTP.request(method, url, headers, body, function(err, status, headers, body) {
		ok(!err && status > 0, 'HTTP.request');
	});
});
