/*
"features": [
{ 
	"type": "Feature", 
	"properties": { 
		"TAG": "600000000031990", 
		"LAST_ORG": "100", 
		"CAPTURE_ME": "BLK", 
		"LAST_USER": null, 
		"EDIT_DATE": "1997\/03\/18", 
		"BLOCKNUM": "5759", 
		"PARCELNUM": "024", 
		"PIN": "5759024", 
		"CNTGRAPH": "24", 
		"BLOCKLOT": "5759 024", 
		"SUBTYPE_GE": 1, 
		"SHAPE_Leng": 454.022031360000028, 
		"SHAPE_Area": 9211.162293330000466, 
		"FULLADDR": "5700 WALTHER AVE", 
		"STDIRPRE": null, 
		"ST_NAME": "WALTHER", 
		"ST_TYPE": "AVE", 
		"BLDG_NO": 5700, 
		"UNIT_NUM": null 
	}, 
	"geometry": { 
		"type": "Polygon", 
		"coordinates": [ 
			[ 
				[ -76.550116308239168, 39.348380530527109 ], 
				[ -76.550102784136087, 39.348394206713969 ], 
				[ -76.549760737165798, 39.348739733679501 ], 
				[ -76.549513629676127, 39.348596022818398 ], 
				[ -76.550047502328184, 39.34834045818512 ], 
				[ -76.550116308239168, 39.348380530527109 ] 
			] 
		] 
	} 
}
 */



var fs = require('fs');
var async = require('async');

var Property = require('../app/Property.js');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
});

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
  if(err1) throw err1;

	var collection = db.collection('property');
	var queue = [], x = 0;

	fs.readFile('./data/parcels.geojson', 'utf-8', function(err2, contents) {
		var data = JSON.parse(contents),
			len = data.features.length;
		console.log(len);
		for (var i = 0; i < len; i++){
			//console.log(data.features[i].properties.PIN);
			queue.push(data.features[i]);
		}
    	queue.push({
    		done: true
    	});
    	async.eachSeries(queue, function(data, callback){
    		if (data.done){
    			console.log('done');
    		}else{
    			console.log(data.properties.PIN);
				collection.find({
					_id: data.properties.PIN
				}, function(err, result){
					if (err){
						console.log(err);
					} else {
						if(result.length == 1){
							result[0].geometry = data.geometry;
							result[0].lot_area = data.properties.SHAPE_Area;
							collection.update({
								_id: data.properties.PIN
							}, result[0], function(){
								setImmediate(function() { 
							  	    callback(); 
							    });
							});
						} else {
							console.log('None or too many results: '+ results.length);
						}
					}
				});
    		}
    	});
    });
});