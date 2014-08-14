var cheerio = require('cheerio');
var fs = require('fs');
var csv = require('csv-stream');
var request = require('request');
var async = require('async');

var firstTime = false;

var min = process.argv.slice(2);
var max = process.argv.slice(3);

var Property = require('../app/Property.js');

process.on('uncaughtException', function(error) {
	console.log(error.stack);
});

var missingBlocks = [];
var prefix = 'ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_DataGrid1_ctl';
var MongoClient = require('mongodb').MongoClient;

function parsePage(page) {
	var props = [];

	for (var i = 2; i < 52; i++) {
		var inc = (i < 10) ? '0' + i : i;

		page('#' + prefix + inc + '_lblOwner1').closest('td').prev().prev().prev().each(function() {
			props[i] = [];
			props[i][0] = page(this).text().trim();
		});
		page('#' + prefix + inc + '_lblOwner1').closest('td').prev().prev().each(function() {
			props[i][1] = page(this).text().trim();
		});
		if (props[i] && props[i][1].trim() == '') {
			props[i] = undefined;
		} else {
			page('#' + prefix + inc + '_lblOwner1').closest('td').prev().each(function() {
				props[i][2] = page(this).text().replace('.', '').trim();
			});
			page('#' + prefix + inc + '_lblOwner1').each(function() {
				props[i][3] = page(this).text().replace('.', '').trim();
				//console.log("found owner line 1 for " + i);
			});
			page('#' + prefix + inc + '_lblOwner2').each(function() {
				props[i][4] = page(this).text().replace('.', '').trim();
			});
			page('#' + prefix + inc + '_lblOwner3').each(function() {
				props[i][5] = page(this).text().replace('.', '').trim();
			});
			page('#' + prefix + inc + '_lblOwner4').each(function() {
				props[i][6] = page(this).text().replace('.', '').trim();
			});

		}
	}

	return props;
}

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
	if (err1) throw err1;

	var collection = db.collection('property');
	var queue = [],
		x = 0,
		queueprop = [];
	var cvsrs = csv.createStream();
	//queue.push({block:'0023'});
	var rs = fs.createReadStream('./data/block.csv', {
		autoClose: true
	}).pipe(cvsrs).on('error', function(err) {
		console.error(err);
	}).on('end', function() {
		queue.push({
			done: true
		});
		async.eachSeries(queue, function(data, callback) {
			if (data.done) {
				console.log("done parsing property files");
				queueprop.push({
					done: true
				});
				console.log("going to update " + queueprop.length);
				async.eachSeries(queueprop, function(rawdata2, callback2) {
					//console.log('starting to update properties', rawdata2);
					if (rawdata2.done) {
						if (missingBlocks.length > 0) {
							console.log('Missing Blocks: ' + missingBlocks.join(', '));
						}
						console.log('done');

						setImmediate(function() {
							callback2();
						});

					} else {
						console.log("finding property");
						collection.findOne({
							_id: rawdata2.properties.block + rawdata2.properties.lot
						}, function(err, result) {
							//console.log('result of find being processed');
							if (err) {
								console.log("Error:", err);
								setImmediate(function() {
									callback2();
								});
							} else if (rawdata2 !== null && result !== null) {
								console.log('Updating existing property for ' + rawdata2.properties.owner_name1 + ' @ ' + rawdata2.properties.block + rawdata2.properties.lot);

								delete result.properties.primary_owner_name;
								delete result.properties.secondary_owner_name;
								delete result.properties.tertiary_owner_name;

								result.properties.owner_name1 = rawdata2.properties.owner_name1;
								result.properties.owner_name2 = rawdata2.properties.owner_name2;
								result.properties.owner_name3 = rawdata2.properties.owner_name3;
								result.properties.owner_type = rawdata2.properties.owner_type;
								result.properties.owner_occupied = rawdata2.properties.owner_occupied;
								result.properties.owner_address = rawdata2.properties.owner_address;
								result.properties.owner_city = rawdata2.properties.owner_city;
								result.properties.owner_state = rawdata2.properties.owner_state;
								result.properties.owner_zip = rawdata2.properties.owner_zip;
								result.properties.owner1 = rawdata2.properties.owner1;
								result.properties.owner2 = rawdata2.properties.owner2;
								result.properties.owner3 = rawdata2.properties.owner3;
								result.properties.owner4 = rawdata2.properties.owner4;
								result.properties.last_updated = new Date();

								//console.log("QUERY RESULTS:", result._id, result, rawdata2);

								collection.update({
									_id: result._id
								}, result, function() {
									console.log('udated property');
									setImmediate(function() {
										callback2();
									});
								});
							} else {
								console.log('***** ERROR ****** Updating existing property for ', rawdata2);
								setImmediate(function() {
									callback2();
								});
							}
						}); //end find one

					}
				});
			} else {
				if (data.block) {
					var block = data.block.trim();

					block = (block.length == 1) ? '000' + block : block;
					block = (block.length == 2) ? '00' + block : block;
					block = (block.length == 3) ? '0' + block : block;

					fs.readFile('./cache/block-list-' + block + '.html', 'utf-8', function(err2, contents) {
						if (err2) {
							//console.log(err2);
							if (block) {
								console.log(block);
								missingBlocks.push(block);
							}
							setImmediate(function() {
								callback();
							});
						} else {

							var page = cheerio.load(contents);
							var properties = parsePage(page);

							for (var i = 0; i < properties.length; i++) {

								if (properties[i]) {
									//console.log(properties[i]);
									var prop = new Property();
									prop.createFromRaw({
										block: properties[i][0],
										lot: properties[i][1],
										address: properties[i][2],
										owner1: properties[i][3],
										owner2: properties[i][4],
										owner3: properties[i][5],
										owner4: properties[i][6]
									});

									var rawdata = prop.getData();
									//console.log("RAW DATA:", rawdata);

									queueprop.push(rawdata);

									setImmediate(function() {
										callback();
									});

								} //end property exists
							} //end for
						} //end err
					}); //end read file
				} //end data done
			}
		}); //end each series
	}).on('data', function(data) {

		if (parseInt(data.block) >= parseInt(min) && parseInt(data.block) <= parseInt(max)) {

			queue.push(data);

		}

	}); // end read stream
});