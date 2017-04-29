var fs = require('fs');
var async = require('async');

process.on('uncaughtException', error => {
	console.log(error.stack);
});

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', (err1, db) => {
    if (err1) throw err1;

    var collection = db.collection('neighborhood');
    var queue = [];
    var x = 0;

    fs.readFile('./data/nhood_2010.geojson', 'utf-8', (err2, contents) => {
        var data = JSON.parse(contents);
        var len = data.features.length;
        //console.log(len);
        for (var i = 0; i < len; i++) {
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
				console.log(data.properties.Name);
				collection.findOne({
					_id: data.properties.Name
				}, (err, result) => {
					console.log('result of find being processed');
					if (err) {
						console.log(err);
						setImmediate(() => {
							callback();
						});
					} else {
						console.log('result of find has no error');
						if (result != null) {
							console.log('Updating existing neighborhood for ' + data.properties.Name);
							result.geometry = data.geometry;
							result.properties = data.properties;
							collection.update({
								_id: data.properties.Name
							}, result, () => {
								setImmediate(() => {
									callback();
								});
							});
						} else {
							if (result == null) {
								console.log('No neighborhood exists yet, adding one for ' + data.properties.Name);
								var entry = {
									_id: data.properties.Name,
									geometry: data.geometry,
									properties: data.properties
								};
								collection.insert(entry, {
									w: 1
								}, (err, result2) => {
									if (err) {
										console.log(err);
									} else {
										console.log(result2[0].properties.Name);
									}
									setImmediate(() => {
										callback();
									});
								});
							} else {
								console.log('Result is something else : ' + result);
								setImmediate(() => {
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