var remotePdf = "http://static.baltimorehousing.org/pdf/vtov_list.pdf";
var salesPdf = "./data/vtov_list.pdf";

var nodeUtil = require("util"),
	fs = require('fs'),
	http = require('http'),
	_ = require('underscore'),
	PDFParser = require("pdf2json/pdfparser");

/*var file = fs.createWriteStream(salesPdf);

file.on('finish', function() {
	file.close(connectDbAndProcess);
});

http.get(remotePdf, function(response) {
	response.pipe(file);
});*/

var queue = [];

var helpers = {
	isAddress: function(val) {
		return /\d .* (ST|AVE|PL|CIR|AL|ROAD|BLVD|UNIT.*|NORTHWAY|SOUTHWAY)/.test(val);
	},
	getBlock: function(texts, i) {
		var block = unescape(texts[i - 1].R[0].T).trim().substr(0, 5).trim();
		if (block.length > 3) {
			return block;
		} else {
			return unescape(texts[i - 2].R[0].T).trim().substr(0, 5).trim()
		}
	},
	getLot: function(texts, i) {
		var lot = unescape(texts[i - 1].R[0].T).trim().substr(5, 4).trim();
		if (!lot) {
			lot = unescape(texts[i - 1].R[0].T).trim();
		}
		return lot;
	},
	getZip: function(texts, i) {
		if (unescape(texts[i + 2].R[0].T).trim() == '-') {
			if (this.isZip(unescape(texts[i + 3].R[0].T).trim())) {
				return unescape(texts[i + 1].R[0].T).trim() + "-" + unescape(texts[i + 3].R[0].T).trim();
			} else {
				return unescape(texts[i + 1].R[0].T).trim();
			}
		} else {
			return unescape(texts[i + 1].R[0].T).trim();
		}
	},
	getNeighborhood: function(texts, i) {
		if (unescape(texts[i + 2].R[0].T).trim() == '-') {
			if (!this.isType(unescape(texts[i + 4].R[0].T).trim())) {
				return unescape(texts[i + 4].R[0].T).trim();
			} else {
				return unescape(texts[i + 3].R[0].T).trim();
			}
		} else {
			if (!this.isType(unescape(texts[i + 2].R[0].T).trim())) {
				return unescape(texts[i + 2].R[0].T).trim();
			} else {
				return unescape(texts[i + 1].R[0].T).trim();
			}
		}
	},
	getType: function(texts, i) {
		for (var k = 2; k < 10; k++) {
			if (this.isType(unescape(texts[i + k].R[0].T).trim())) {
				var type = unescape(texts[i + k].R[0].T).trim();
				if (this.isType(unescape(texts[i + k + 1].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i + k + 1].R[0].T).trim();
				}
				if (this.isType(unescape(texts[i + k + 2].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i + k + 2].R[0].T).trim();
				}
				if (this.isType(unescape(texts[i + k + 3].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i + k + 3].R[0].T).trim();
				}
				return type;
			}
		}
		return null;
	},
	isType: function(val) {
		return /(Vacant|Building|Lot|Commercial|Vacant Building|Vacant Lot|Commercial-Vacant Building)/.test(val);
	},
	getZoning: function(texts, i) {
		for (var k = 2; k < 10; k++) {
			if (texts[i + k] && this.isZoningStart(unescape(texts[i + k].R[0].T).trim())) {
				if (texts[i + k + 3] && unescape(texts[i + k + 3].R[0].T).trim() == "-") {
					if (texts[i + k + 2] && texts[i + k + 4]) {
						return unescape(texts[i + k].R[0].T).trim() + "-" + unescape(texts[i + k + 2].R[0].T).trim() + "-" + unescape(texts[i + k + 4].R[0].T).trim();
					}
				} else {
					if (texts[i + k + 2]) {
						return unescape(texts[i + k].R[0].T).trim() + "-" + unescape(texts[i + k + 2].R[0].T).trim();
					}
				}
			}
		}
		return null;
	},
	isZoningStart: function(val) {
		return (val == 'B' || val == 'R' || val == 'M' || val == 'O' || val == 'TBD');
	},
	isZip: function(val) {
		return /\d/.test(val);
	},
	getId: function(texts, i) {
		var id = unescape(texts[i - 2].R[0].T).trim(),
			block = this.getBlock(texts, i);
		if (id == block) {
			id = unescape(texts[i - 3].R[0].T).trim()
		}
		return id;
	},
	isNextId: function(val, id) {
		return (parseInt(val, 10) == (parseInt(id, 10) + 1));
	},
	getPrice: function(texts, i) {
		var id = this.getId(texts, i);
		for (var k = 4; k < 14; k++) {
			if (texts[i + k - 1] && texts[i + k] && this.isNextId(unescape(texts[i + k].R[0].T).trim(), id)) {
				var price = parseInt(unescape(texts[i + k - 1].R[0].T).trim(), 10);
				if (price > 999) {
					return parseInt(unescape(texts[i + k - 1].R[0].T).trim(), 10);
				}
			}
		}
		return null
	}
};

var processData = function(cb) {

	var pdfParser = new PDFParser();

	var _onPFBinDataReady = function(pdf) {
		var list = '';
		console.log('processing ' + pdf.data.Pages.length + ' pages of vacants');
		for (var x = 0; x < pdf.data.Pages.length; x++) {
			console.log('on page ' + x);
			var texts = pdf.data.Pages[x].Texts;
			//console.log(texts);
			var l = 0;

			pdf.data.Pages[x].Texts.forEach(function(text, i) {
				var prop = {};
				//console.log(text.R);
				var val = unescape(text.R[0].T).trim();
				//console.log(val);
				//console.log(val);
				if (x == 0 && l == 3) {
					list = val;
					console.log(list);
				}

				if (helpers.isAddress(val)) {
					prop.address = val;
					prop.id = helpers.getId(texts, i);
					prop.block = helpers.getBlock(texts, i);
					prop.lot = helpers.getLot(texts, i);
					prop.zip = helpers.getZip(texts, i);
					prop.neighborhood = helpers.getNeighborhood(texts, i);
					prop.zoning = helpers.getZoning(texts, i);
					prop.type = helpers.getType(texts, i);
					prop.price = helpers.getPrice(texts, i);
					prop.date = new Date(list);
					queue.push(prop);
				}
				l++;
			});
		}
		console.log(queue.length);
		cb(queue);
	};

	var _onPFBinDataError = function() {
		console.log(arguments);
	};

	pdfParser.on("pdfParser_dataReady", _.bind(_onPFBinDataReady, this));

	pdfParser.on("pdfParser_dataError", _.bind(_onPFBinDataError, this));

	var pdfFilePath = salesPdf;

	pdfParser.loadPDF(pdfFilePath);

};

var connectDbAndProcess = function() {

	var MongoClient = require('mongodb').MongoClient;

	MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
		if (err1) throw err1;

		var collection = db.collection('property');
		var updates = 0;
		var inserts = 0;

		processData(function(queue) {
			console.log('Found ' + queue.length + ' offerings');
			queue.push({
				done: true
			});
			console.log(queue.length + ' done');
			//async.eachSeries(queue, function(data, callback) {
			var callback = function() {};
			queue.forEach(function(data) {
				console.log('doing something');
				if (data.done) {
					console.log('Done, updated ' + updates + ' and inserted ' + inserts + ' new records.');
					setImmediate(function() {
						callback();
						process.exit(0);
					});
				} else {
					console.log('working on : ' + data.block + data.lot);
					collection.findOne({
						_id: data.block + data.lot
					}, function(err, result) {
						console.log('returned on : ' + data.block + data.lot);
						if (err) {
							console.log(err);
							setImmediate(function() {
								callback();
								process.exit(1);
							});
						} else {
							console.log('updated on : ' + data.block + data.lot);
							if (result != null) {
								var offering = {
									type: data.type,
									zoning: data.zoning,
									price: parseFloat(data.price),
									date: new Date(data.date)
								};
								if (!result.properties.v2vofferings) {
									result.properties.v2vofferings = [offering];
									inserts++;
								} else {
									var foundPurchaser = false;
									for (var i = 0; i < result.properties.v2vofferings.length; i++) {
										if (result.properties.v2vofferings[i].date.getTime() == offering.date.getTime()) {
											foundOffering = true;
											result.properties.v2vofferings[i] = offering;
											updates++;
										}
									}
									if (!foundOffering) {
										result.properties.v2vofferings.push(offering);
										inserts++;
									}
								}
								console.log(result.properties);
								/*collection.update({
									_id: data.block + data.lot
								}, result, function() {
									setImmediate(function() {
										callback();
									});
								});*/
							} else {
								console.log('null record');
								setImmediate(function() {
									callback();
								});
							}
						}
					});
				}
			});
			console.log('past async');
		});

	});
};

connectDbAndProcess();