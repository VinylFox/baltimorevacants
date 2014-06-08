var express = require("express");
var logfmt = require("logfmt");
var mongo = require('mongodb');

var HtmlPage = require('./app/HtmlPage.js');

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/baltimorevacants';

mongo.Db.connect(mongoUri, function (err, db) {
  if (err) throw err;
  console.log("Connected to database");
  db.collection('properties', function(er, collection) {
  	console.log("Initialized property collection");
  });
});

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

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
  console.log("Listening on " + port);
});
