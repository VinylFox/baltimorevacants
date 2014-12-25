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

	var field = req.query.field,
		bbox;

	if (req.query.bbox) {
		bbox = req.query.bbox.split(',').map(function(e) {
			return parseFloat(e);
		});
		var topLeft = [bbox[1], bbox[2]];
		var topRight = [bbox[3], bbox[2]];
		var botRight = [bbox[3], bbox[0]];
		var botLeft = [bbox[1], bbox[0]];
		bbox = [
			[topLeft, topRight, botRight, botLeft, topLeft]
		];
	}

	var query = [{
		'$match': {}
	}, {
		'$group': {
			'_id': '$properties.' + field,
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
	query[0]['$match']['properties.' + field] = {
		'$ne': ''
	};

	if (bbox) {
		query[0]['$match']['geometry'] = {
			"$geoIntersects": {
				"$geometry": {
					type: "Polygon",
					coordinates: bbox
				}
			}
		};
	}

	this.data.aggregate(res, 'property', query, 'json', cb);

};

Properties.prototype.doOwnerSearch = function(req, res, cb) {

	if (!req.query.owner_name) res.jsonp({
		error: ['no owner specified']
	});

	var owner_name = req.query.owner_name.toUpperCase();

	var query = {
		"$text": {
			"$search": '"' + owner_name + '"'
		}
	};

	this.data.query(res, 'property', query, 'geojson', cb);

};

Properties.prototype.propertyList = function(req, res, cb) {

	if (!req.query.block) res.jsonp({
		error: ['no block specified']
	});

	this.doPropertyMatchSearch('block', req.query.block, req, res, cb);

};

Properties.prototype.doTypeSearch = function(req, res, cb) {

	if (!req.query.type) res.jsonp({
		error: ['no type specified']
	});

	var type = req.query.type.toUpperCase();

	this.doPropertyMatchSearch('owner_type', type, req, res, cb);

};

Properties.prototype.doPropertyMatchSearch = function(property, val, req, res, cb) {

	var query = {};
	query["properties." + property] = val;

	this.data.query(res, 'property', query, 'geojson', cb);

};

Properties.prototype.neighborhoodList = function(req, res, cb) {

	var me = this,
		query = {};

	this.data.query(res, 'neighborhood', query, 'json', function(resp) {
		var hoods = [],
			data = resp.data;

		for (var i = 0; i < data.length; i++) {
			hoods.push({
				name: data[i]._id
			});
		}

		cb(hoods);
	});

};

Properties.prototype.neighborhoodShapes = function(req, res, cb) {

	var me = this,
		query = {};

	this.data.query(res, 'neighborhood', query, 'geojson', cb);

};

Properties.prototype.doNeighborhoodSearch = function(req, res, cb) {

	var me = this,
		query = (req.query.name && req.query.name != 'undefined') ? {
			"properties.LABEL": req.query.name.trim()
		} : {};

	this.data.query(res, 'neighborhood', query, 'json', function(resp) {
		var bounds = (resp.data[0] && resp.data[0].geometry && resp.data[0].geometry.coordinates) ? resp.data[0].geometry.coordinates : [];
		me.doBoundsSearch(req, res, cb, bounds, 'property');
	});

};

Properties.prototype.doBoxSearch = function(req, res, cb) {

	if (!req.query.bbox) res.jsonp({
		error: ['no bbox specified']
	});

	var bbox = req.query.bbox.split(',').map(function(e) {
		return parseFloat(e);
	});

	var topLeft = [bbox[1], bbox[2]];
	var topRight = [bbox[3], bbox[2]];
	var botRight = [bbox[3], bbox[0]];
	var botLeft = [bbox[1], bbox[0]];

	var dist = this.lineDistance([bbox[1], bbox[0]], [bbox[3], bbox[2]]);

	if (dist < 0.03) {

		var collection = 'property';

	} else {

		var collection = 'neighborhood';

	}

	var bounds = [
		[topLeft, topRight, botRight, botLeft, topLeft]
	];

	this.doBoundsSearch(req, res, cb, bounds, collection)

};

Properties.prototype.doBoundsSearch = function(req, res, cb, bounds, collection) {

	var query = {
		"geometry": {
			"$geoIntersects": {
				"$geometry": {
					type: "MultiPolygon",
					coordinates: bounds
				}
			}
		}
	};

	this.data.query(res, collection, query, 'geojson', cb);

};

Properties.prototype.doV2VSearch = function(req, res, cb) {
	var query = {
		"properties.v2vpurchases.0": { 
			"$exists": true 
		}
	};

	this.data.query(res, 'property', query, 'geojson', cb);
}

module.exports = Properties;