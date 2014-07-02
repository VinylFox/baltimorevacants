var mongo = require('mongodb');

var Data = function(config) {
	for (var prop in config) this[prop] = config[prop];
};

Data.prototype.connect = function(cb) {

	mongo.Db.connect(this.mongoUri, function(err, db) {
		if (err) throw err;
		console.log("Connected to database");
		cb(db);
	});

}

Data.prototype.toGeoJson = function(data) {

	var geo = [];
	for (var i = 0; i < data.length; i++) {
		var feature = {
			"type": "Feature",
			geometry: data[i].geometry,
			properties: {}
		};
		if (!data[i].properties) {
			for (prop in data[i]) {
				feature.properties[prop] = data[i][prop];
			}
		} else {
			feature.properties = data[i].properties;
		}
		geo.push(feature);
	}
	return {
		"type": "FeatureCollection",
		"features": geo
	};

}

Data.prototype.toJson = function(data) {
	return {
		data: data,
		results: data.length
	}
}

Data.prototype.query = function(res, collection, query, resultType, resCb) {
	var me = this;
	this.connect(function(db) {
		//console.log(arguments);
		var col = db.collection(collection);

		col.find(query).toArray(function(err, results) {
			console.log("query complete");
			if (err) {
				console.log(err);
				resCb({
					status: 500,
					data: [],
					error: err
				});
			} else {
				if (resultType == 'geojson') {
					var resp = me.toGeoJson(results);
				} else {
					var resp = me.toJson(results);
				}
				resCb(resp);
			}
		});
	});
}

module.exports = Data;