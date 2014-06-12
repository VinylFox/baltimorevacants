var express = require("express");
var logfmt = require("logfmt");

var HtmlPage = require('./app/HtmlPage.js');
var Properties = require('./app/Properties.js');

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/baltimorevacants';

var app = express();

app.use('/lib', express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/lib'));

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  new HtmlPage().render('index', function(page){
  	res.set('Content-Type', 'text/html');
  	res.send(page);
  });
});

app.get('/testmap', function(req, res) {
  new HtmlPage().render('testmap', function(page){
    res.set('Content-Type', 'text/html');
    res.send(page);
  });
});

app.get('/owners', function(req, res) {
    var properties = new Properties({
      mongoUri: mongoUri
    });
    properties.doOwnerSearch(req, res);
});

app.get('/multipoly', function(req, res) {
    var properties = new Properties({
      mongoUri: mongoUri
    });
    properties.multiPolygons(req, res);
});

app.get('/summary', function(req, res) {
    var properties = new Properties({
      mongoUri: mongoUri
    });
    properties.doSummary(req, res);
});

app.get('/bounds', function(req, res) {
    var properties = new Properties({
      mongoUri: mongoUri
    });
    properties.doBoundsSearch(req, res);
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
  console.log("Listening on " + port);
});
