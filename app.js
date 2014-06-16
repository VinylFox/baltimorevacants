var express = require("express");
var logfmt = require("logfmt");
var favicon = require('serve-favicon');

var HtmlPage = require('./app/HtmlPage.js');
var Properties = require('./app/Properties.js');

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/baltimorevacants';

var app = express();

app.set('view engine', 'jade');

app.use('/lib', express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/lib'));

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
	res.render('index', {
		title: 'Baltimore Vacants'
	});
});

app.get('/testmap', function(req, res) {
	new HtmlPage().render('testmap', function(page) {
		res.set('Content-Type', 'text/html');
		res.send(page);
	});
});

app.get('/api/:type', function(req, res) {
	var properties = new Properties({
		mongoUri: mongoUri
	});
	var cb = function(resp) {
		res.json(resp);
	};
	switch (req.params.type) {
		case "owner":
			properties.doOwnerSearch(req, res, cb);
			break;
		case "type":
			properties.doTypeSearch(req, res, cb);
			break;
		case "summary":
			properties.doSummary(req, res, cb);
			break;
		case "bounds":
			properties.doBoundsSearch(req, res, cb);
			break;
		default:
			cb({
				data: [],
				results: 0,
				success: false,
				error: ['API method unknown']
			});
	}
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});