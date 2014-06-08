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


app.get('/bounds', function(req, res) {
    // expecting bbox=bottom,left,top,right
    // 39.305969,-76.616538,39.312311,-76.603374
    // like: http://localhost:3000/taxlots?bbox=40.785496,-73.980560,40.795342,-73.970861

  mongo.Db.connect(mongoUri, function (err, db) {
    if (err) throw err;
    console.log("Connected to database");

    var collection = db.collection('property');

    if (!req.query.bbox) res.jsonp({});
    var bbox = req.query.bbox.split(',').map(function (e) { return parseFloat(e); });

    var topLeft = [bbox[2], bbox[1]];
    var topRight = [bbox[2], bbox[3]];
    var botRight = [bbox[0], bbox[3]];
    var botLeft = [bbox[0], bbox[1]];

    //console.log(topLeft, topRight, botRight, botLeft);

    var query = {
      "geometry":{
        "$geoWithin":{
          "$geometry":{
            type:"Polygon",
            coordinates:[
              [topLeft, topRight, botRight, botLeft, topLeft]
            ]
          }
        }
      }
    };

    collection.find(query).toArray(function(err, properties) {
        console.log("geo search complete");
        var geo = [];
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            for(var i = 0; i < properties.length; i++){
              geo.push({
                "type": "Feature",
                geometry: properties[i].geometry,
                properties: {
                  address: properties[i].property_address,
                  blocklot: properties[i]._id
                }
              });
            }
            res.json({
              "type": "FeatureCollection",
              "features": geo
            });
        }
    });
  });
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
  console.log("Listening on " + port);
});
