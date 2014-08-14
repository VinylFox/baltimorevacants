var express = require("express");
var logfmt = require("logfmt");
var path = require("path");
var favicon = require('serve-favicon');
var lessMiddleware = require('less-middleware');

var HtmlPage = require('./app/HtmlPage.js');
var Properties = require('./app/Properties.js');

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/baltimorevacants';

var app = express();

app.set('view engine', 'jade');

app.use(logfmt.requestLogger());

app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/bower_components'));

app.get('/', function(req, res) {
	res.render('index', {
		title: 'Baltimore Vacants'
	});
});

app.get('/map', function(req, res) {
	res.render('map', {
		title: 'Baltimore Vacants Map'
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
			properties.doBoxSearch(req, res, cb);
			break;
		case "neighborhood":
			properties.doNeighborhoodSearch(req, res, cb);
			break;
		case "neighborhoodshapes":
			properties.neighborhoodShapes(req, res, cb);
			break;
		case "neighborhoodlist":
			properties.neighborhoodList(req, res, cb);
			break;
		case "properties":
			properties.propertyList(req, res, cb);
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
	console.log("Server started. Listening on " + port);
});