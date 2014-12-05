var fs = require('fs');
var async = require('async');

process.on('uncaughtException', function(error) {
	console.log(error.stack);
});

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
	if (err1) throw err1;

	var collection = db.collection('neighborhood');
	var queue = [],
		x = 0;

	fs.readFile('./data/nhood_2010.geojson', 'utf-8', function(err2, contents) {
		var data = JSON.parse(contents),
			len = data.features.length;
		//console.log(len);
		for (var i = 0; i < len; i++) {
			queue.push(data.features[i]);
		}
		queue.push({
			done: true
		});
		async.eachSeries(queue, function(data, callback) {
			if (data.done) {
				console.log('done');
				setImmediate(function() {
					callback();
				});
			} else {
				console.log(data.properties.Name);
				collection.findOne({
					_id: data.properties.Name
				}, function(err, result) {
					console.log('result of find being processed');
					if (err) {
						console.log(err);
						setImmediate(function() {
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
							}, result, function() {
								setImmediate(function() {
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
								}, function(err, result2) {
									if (err) {
										console.log(err);
									} else {
										console.log(result2[0].properties.Name);
									}
									setImmediate(function() {
										callback();
									});
								});
							} else {
								console.log('Result is something else : ' + result);
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