QUnit.module('http');

QUnit.asyncTest('request callback', function () {
	var method = 'GET';
	var url = 'https://api.github.com/gists/public';
	var headers = {'Accept': 'application/json'};
	var body = '';
	http.request(method, url, headers, body, function(err, status, headers, body) {
		ok(!err && status > 0, 'http.request');
		start();
	});
});

QUnit.asyncTest('request promise', function () {
	var method = 'GET';
	var url = 'https://api.github.com/gists/public';
	var headers = {'Accept': 'application/json'};
	var body = '';
	http.request(method, url, headers, body)
		.then(function (res) {
			ok(res.status > 0, 'invalid status');
			start();
		})
		.catch(function () {
			ok(false, 'exception');
		});
});

QUnit.asyncTest('get promise', function () {
	http.get({
		url: 'https://api.github.com/gists/public',
		headers: { 'Accept': 'application/json' }})
		.then(function (res) {
			ok(res.status > 0, 'invalid status');
			start();
		})
		.catch(function () {
			ok(false, 'exception');
		});
});
