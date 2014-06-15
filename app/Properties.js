var mongo = require('mongodb');
var Data = require('./Data.js');

var Properties = function(config) {
	for (var prop in config) this[prop] = config[prop];
	this.data = new Data(this);
};

Properties.prototype.lineDistance = function(point1, point2) {
	var xs = 0;
	var ys = 0;

	xs = point2[1] - point1[1];
	xs = xs * xs;

	ys = point2[0] - point1[0];
	ys = ys * ys;

	return Math.sqrt(xs + ys);
};

Properties.prototype.doSummary = function(req, res, cb) {

	if (!req.query.field) res.jsonp({});

	var field = req.query.field;

	var query = [{
		'$match': {}
	}, {
		'$group': {
			'_id': '$' + field,
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

	this.data.query(res, 'property', query, 'json', cb);

};

Properties.prototype.doOwnerSearch = function(req, res, cb) {

	if (!req.query.owner_name) res.jsonp({});

	var owner_name = req.query.owner_name.toUpperCase();

	var query = {
		"$text": {
			"$search": owner_name
		}
	};

	this.data.query(res, 'property', query, 'geojson', cb);

};

Properties.prototype.doTypeSearch = function(req, res, cb) {

	if (!req.query.type) res.jsonp({});

	var type = req.query.type.toUpperCase();

	this.doPropertyMatchSearch('owner_type', type, req, res, cb);

};

Properties.prototype.doPropertyMatchSearch = function(property, val, req, res, cb) {

	var query = {};
	query[property] = val;

	this.data.query(res, 'property', query, 'geojson', cb);

};

Properties.prototype.doBoundsSearch = function(req, res, cb) {

	if (!req.query.bbox) res.jsonp({});

	var bbox = req.query.bbox.split(',').map(function(e) {
		return parseFloat(e);
	});

	var topLeft = [bbox[1], bbox[2]];
	var topRight = [bbox[3], bbox[2]];
	var botRight = [bbox[3], bbox[0]];
	var botLeft = [bbox[1], bbox[0]];

	var dist = this.lineDistance([bbox[1], bbox[0]], [bbox[3], bbox[2]]);

	if (dist < 0.02) {

		var collection = 'property';

	} else {

		var collection = 'neighborhood';

	}

	var query = {
		"geometry": {
			"$geoIntersects": {
				"$geometry": {
					type: "Polygon",
					coordinates: [
						[topLeft, topRight, botRight, botLeft, topLeft]
					]
				}
			}
		}
	};

	this.data.query(res, collection, query, 'geojson', cb);

};

module.exports = Properties;