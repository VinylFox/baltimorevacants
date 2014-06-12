var mongo = require('mongodb');
var Data = require('./Data.js');

var Properties = function(config){
  for (var prop in config) this[prop] = config[prop];
  this.data = new Data(this);
};

Properties.prototype.lineDistance = function( point1, point2 ) {
  var xs = 0;
  var ys = 0;
 
  xs = point2[1] - point1[1];
  xs = xs * xs;
 
  ys = point2[0] - point1[0];
  ys = ys * ys;
 
  return Math.sqrt( xs + ys );
};

Properties.prototype.doSummary = function(req, res, cb){

  var me = this;

  mongo.Db.connect(this.mongoUri, function (err, db) {
    if (err) throw err;
    console.log("Connected to database");

    if (!req.query.field) res.jsonp({});

    var field = req.query.field;

    var collection = db.collection('property');

    query = [{
        '$match': {}
    }, {
        '$group': {
            '_id': '$'+field,
            'totalSize': {
                '$sum': 1
            }
        }
    }, {
        '$sort': {
            'totalSize': -1
        }
    }, {
      '$limit': 50
    }];
    query[0]['$match'][field] = {
        '$ne': ''
    };

    console.log(JSON.stringify(query));

    collection.aggregate(query, function(err, properties) {
        console.log("owner search complete");
        var geo = [];
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            for(var i = 0; i < properties.length; i++){
              var feature = {
                "type": "Feature",
                geometry: properties[i].geometry,
                properties: {}
              };
              if (!properties[i].properties){
                for (prop in properties[i]){
                  feature.properties[prop] = properties[i][prop];
                }
              } else {
                feature.properties = properties[i].properties;
              }
              geo.push(feature);
            }
            res.json({
              "type": "FeatureCollection",
              "features": geo
            });
        }
    });
  });

};

Properties.prototype.multiPolygons = function(req, res, cb){

  var query = {"error":true};

  this.data.query(res, 'property', query, 'geojson');

};

Properties.prototype.doOwnerSearch = function(req, res, cb){

  if (!req.query.owner_name) res.jsonp({});

  var owner_name = req.query.owner_name.toUpperCase();

  var query = {
      "$text":{
          "$search": owner_name
      }
  };

  this.data.query(res, 'property', query, 'geojson');

};

Properties.prototype.doBoundsSearch = function(req, res, cb){

  var me = this;

  mongo.Db.connect(this.mongoUri, function (err, db) {
    if (err) throw err;
    console.log("Connected to database");

    if (!req.query.bbox) res.jsonp({});
    // south, west, north, east
    // 0    , 1   ,2     ,3

    var bbox = req.query.bbox.split(',').map(function (e) { return parseFloat(e); });

    var topLeft = [bbox[1], bbox[2]];
    var topRight = [bbox[3], bbox[2]];
    var botRight = [bbox[3], bbox[0]];
    var botLeft = [bbox[1], bbox[0]];

    var dist = me.lineDistance([bbox[1], bbox[0]], [bbox[3], bbox[2]])

    console.log((dist < 0.02)?'property':'neighborhood', topLeft, topRight, botRight, botLeft, dist);

    if (dist < 0.02){

      var collection = db.collection('property');

    }else{

      var collection = db.collection('neighborhood');

    }

    var query = {
      "geometry":{
        "$geoIntersects":{
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
              var feature = {
                "type": "Feature",
                geometry: properties[i].geometry,
                properties: {}
              };
              if (!properties[i].properties){
                for (prop in properties[i]){
                  feature.properties[prop] = properties[i][prop];
                }
              } else {
                feature.properties = properties[i].properties;
              }
              geo.push(feature);
            }
            res.json({
              "type": "FeatureCollection",
              "features": geo
            });
        }
    });
  });

};

module.exports = Properties;