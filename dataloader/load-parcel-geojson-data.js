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

db.property.ensureIndex({"geometry":"2dsphere"}, {min: -180, max: 180})

 */



var fs = require('fs');
var async = require('async');

process.on('uncaughtException', error => {
	console.log(error.stack);
});

var test = false;

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', (err1, db) => {
    if (err1) throw err1;

    var collection = db.collection('property');
    var queue = [];
    var x = 0;

    fs.readFile('./data/parcels.geojson', 'utf-8', (err2, contents) => {
        var data = JSON.parse(contents);
        var len = data.features.length;
        //console.log(len);
        for (var i = 0; i < len; i++) {
			//console.log(data.features[i].properties.PIN);
			queue.push(data.features[i]);
		}
        queue.push({
			done: true
		});
        async.eachSeries(queue, (data, callback) => {
			if (data.done) {
				console.log('done');
				setImmediate(() => {
					callback();
				});
			} else {
				//console.log(data.properties.PIN);
				collection.findOne({
					_id: data.properties.PIN
				}, (err, result) => {
					//console.log('result of find being processed');
					if (err) {
						console.log(err);
						setImmediate(() => {
							callback();
						});
					} else {
						//console.log('result of find has no error');

						if (data.geometry && data.properties.FULLADDR != '0' && data.properties.FULLADDR != null) {
                            // lets find out if the geometry is valid (ish)
                            var coords = data.geometry.coordinates;

                            var coordlen = data.geometry.coordinates.length;
                            //console.log('First geom lats:',geom[0][0], geom[geomlen-1][0]);
                            //console.log('First geom lngs:',geom[0][1], geom[geomlen-1][1]);
                            for (var i = 0; i < coordlen; i++) {
                                var geom = coords[i];
                                var geomlen = geom.length;
                                if (geom[0][0] != geom[geomlen - 1][0] || geom[0][1] != geom[geomlen - 1][1]) {
									console.log('Start and end are not the same.');
									data.geometry.coordinates[i].push(geom[0]);
								}
                            }

                            /*if (coordlen > 1) {
								console.log("found a ", "MultiPolygon", coordlen);
								data.geometry.type = "MultiPolygon";
							}*/

                            if (result != null) {
								console.log('Updating existing property for ' + data.properties.PIN);
								result.geometry = data.geometry;
								result.properties.lot_area = data.properties.SHAPE_Area;
								if (!test) {
									collection.update({
										_id: data.properties.PIN
									}, result, () => {
										setImmediate(() => {
											callback();
										});
									});
								} else {
									setImmediate(() => {
										callback();
									});
								}
							} else {
								if (result == null) {
									console.log('No property exists yet, adding one for ' + data.properties.PIN);
									var entry = {
										_id: data.properties.PIN,
										properties: {
											block: data.properties.BLOCKNUM,
											lot: data.properties.PARCELNUM,
											property_address: data.properties.FULLADDR,
											lot_area: data.properties.SHAPE_Area
										},
										geometry: data.geometry
									};
									if (!test) {
										collection.insert(entry, {
											w: 1
										}, (err, result2) => {
											if (err) {
												console.log(err);
											} else {
												console.log(result2[0].block + ', ' + result2[0].lot);
											}
											setImmediate(() => {
												callback();
											});
										});
									} else {
										setImmediate(() => {
											callback();
										});
									}
								} else {
									console.log('Result is something else : ' + result);
									setImmediate(() => {
										callback();
									});
								}
							}
                        }
					}
				});
			}
		});
    });
});