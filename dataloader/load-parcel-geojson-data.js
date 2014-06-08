L.geoJson({
	"type": "FeatureCollection",
	"crs": {
		"type": "name",
		"properties": {
			"name": "urn:ogc:def:crs:OGC:1.3:CRS84"
		}
	},
	"features": [{
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
					[-76.550116308239168, 39.348380530527109],
					[-76.550102784136087, 39.348394206713969],
					[-76.549760737165798, 39.348739733679501],
					[-76.549513629676127, 39.348596022818398],
					[-76.550047502328184, 39.34834045818512],
					[-76.550116308239168, 39.348380530527109]
				]
			]
		}
	}]
}, {
	style: function(feature) {
		return {
			color: feature.properties.color
		};
	},
	onEachFeature: function(feature, layer) {
		layer.bindPopup(feature.properties.description);
	}
}).addTo(map);
/*


{ 
	"type": "Feature", 
	"properties": { 
		"TAG": "600000000111598", 
		"LAST_ORG": "100", 
		"CAPTURE_ME": "BLK", 
		"LAST_USER": null, 
		"EDIT_DATE": "1997\/03\/18", 
		"BLOCKNUM": "0001", 
		"PARCELNUM": "001", 
		"PIN": "0001001", 
		"CNTGRAPH": "1", 
		"BLOCKLOT": "0001 001", 
		"SUBTYPE_GE": 1, 
		"SHAPE_Leng": 200.115609114, 
		"SHAPE_Area": 1359.932412800000066, 
		"FULLADDR": "2045 W NORTH AVE", 
		"STDIRPRE": "W", 
		"ST_NAME": "NORTH", 
		"ST_TYPE": "AVE", 
		"BLDG_NO": 2045, 
		"UNIT_NUM": null 
	}, 
	"geometry": { 
		"type": "Polygon", 
		"coordinates": [ 
			[ 
				[ -76.651122944589758, 39.30953029531274 ], [ -76.651122384371405, 39.309522057672069 ], [ -76.651107182164154, 39.309300450820139 ], [ -76.651165894257716, 39.309298510957667 ], [ -76.651178793791388, 39.309528457993686 ], [ -76.651122944589758, 39.30953029531274 ] 
			] 
		] 
	} 
},



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
		//console.log(len);
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
    			setImmediate(function() { 
					callback(); 
				});
    		}else{
    			console.log(data.properties.PIN);
				collection.findOne({
					_id: data.properties.PIN
				}, function(err, result){
					console.log('result of find being processed');
					if (err){
						console.log(err);
						setImmediate(function() { 
							callback(); 
						});
					} else {
						console.log('result of find has no error');
						if(result != null){
							console.log('Updating existing property for '+data.properties.PIN);
							result.geometry = data.geometry;
							result.lot_area = data.properties.SHAPE_Area;
							collection.update({
								_id: data.properties.PIN
							}, result, function(){
								setImmediate(function() { 
									callback(); 
								});
							});
						} else {
							if (result == null){
								console.log('No property exists yet, adding one for '+data.properties.PIN);
								var entry = {
									_id: data.properties.PIN,
								    block: data.properties.BLOCKNUM,
						        	lot: data.properties.PARCELNUM,
						        	property_address: data.properties.FULLADDR
						        };
								collection.insert(entry, {w:1}, function(err, result2){
									if (err){
										console.log(err);
									} else {
										console.log(result2[0].block+', '+result2[0].lot);
									}
								    setImmediate(function() { 
								  	    callback(); 
								    });
								});
							}else{
								console.log('Result is something else : '+result);
								setImmediate(function() { 
									callback(); 
								});
							}
						}
					}
				});
    		}
    	});
    });
});