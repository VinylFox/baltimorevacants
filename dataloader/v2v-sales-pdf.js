var remotePdf = "http://static.baltimorehousing.org/pdf/vtov_settlements.pdf";
var salesPdf = "./data/vtov_settlements.pdf";

var nodeUtil = require("util");
var fs = require('fs');
var http = require('http');
var _ = require('underscore');
var PDFParser = require("pdf2json/pdfparser");
var async = require('async');

var file = fs.createWriteStream(salesPdf);

file.on('finish', () => {
	file.close(connectDbAndProcess);
});

http.get(remotePdf, response => {
	response.pipe(file);
});

var queue = [];

var processData = function(cb) {

	var pdfParser = new PDFParser();

	var _onPFBinDataReady = pdf => {

		console.log(pdf);
		if (pdf.parsePropCount) {
			console.log('processing data');
			for (var x = 0; x < pdf.data.Pages.length; x++) {
				var page = pdf.data.Pages[x];
				var l = 0;
				var c = 8;
				var start = 9;
				var shift = 9;
				var prop = {};
				//if (x < 3){
				if (x > 1) {
					start = 8;
				}
				page.Texts.forEach(text => {
					if (l > start) {
						var val = unescape(text.R[0].T).trim();
						//console.log(((c - shift) % 8)+':'+x+':'+c+':'+val);
						if (((c - shift) % 8) == 0) {
							// block lot
							prop.block = val.substr(0, 5).trim();
							prop.lot = val.substr(5, 4).trim();
						} else if (((c - shift) % 8) == 1) {
							prop.address = val;
						} else if (((c - shift) % 8) == 2) {
							prop.neighborhood = val;
						} else if (((c - shift) % 8) == 3) {
							prop.purchaser = val.replace(/\(.*\)/, '').trim();
						} else if (((c - shift) % 8) == 4) {
							prop.date = val;
						} else if (((c - shift) % 8) == 5) {
							prop.price = val;
						} else if (((c - shift) % 8) == 6) {
							// do nothing
						} else if (((c - shift) % 8) == 7) {
							prop.propertyType = val;
							queue.push(prop);
							prop = {};
						}
						c++;
					}
					l++;
				});
				//}
			}
			queue = _.uniq(queue, item => item.block + item.lot + item.purchaser + item.date);
			//console.log(queue);
			cb(queue);
		}
	};

	var _onPFBinDataError = function(...args) {
		console.log(args);
	};

	pdfParser.on("pdfParser_dataReady", _.bind(_onPFBinDataReady, this));

	pdfParser.on("pdfParser_dataError", _.bind(_onPFBinDataError, this));

	var pdfFilePath = salesPdf;

	pdfParser.loadPDF(pdfFilePath);
};

var connectDbAndProcess = () => {

	var MongoClient = require('mongodb').MongoClient;

	MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', (err1, db) => {
		if (err1) throw err1;

		var collection = db.collection('property');
		var updates = 0;
		var inserts = 0;

		processData(queue => {
			console.log('Found ' + queue.length + ' owners');
			queue.push({
				done: true
			});
			async.eachSeries(queue, (data, callback) => {
				if (data.done) {
					console.log('Done, updated ' + updates + ' and inserted ' + inserts + ' new records.');
					setImmediate(() => {
						callback();
						process.exit(0);
					});
				} else {
					console.log('working on : ' + data.block + data.lot);
					collection.findOne({
						_id: data.block + data.lot
					}, (err, result) => {
						console.log('returned on : ' + data.block + data.lot);
						if (err) {
							console.log(err);
							setImmediate(() => {
								callback();
								process.exit(1);
							});
						} else {
							console.log('updated on : ' + data.block + data.lot);
							if (result != null) {
								var purchaser = {
									name: data.purchaser,
									price: parseFloat(data.price.replace(',', '').replace('-', '0.00')),
									date: new Date(data.date)
								};
								if (!result.properties.v2vpurchases) {
									result.properties.v2vpurchases = [purchaser];
									inserts++;
								} else {
									var foundPurchaser = false;
									for (var i = 0; i < result.properties.v2vpurchases.length; i++) {
										if (result.properties.v2vpurchases[i].name == purchaser.name && result.properties.v2vpurchases[i].date.getTime() == purchaser.date.getTime()) {
											foundPurchaser = true;
											result.properties.v2vpurchases[i] = purchaser;
											updates++;
										}
									}
									if (!foundPurchaser) {
										result.properties.v2vpurchases.push(purchaser);
										inserts++;
									}
								}
								collection.update({
									_id: data.block + data.lot
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
						}
					});
				}
			});
		});

	});
};