var cheerio = require('cheerio');
var fs = require('fs');
var csv = require('csv-stream');
var request = require('request');
var async = require('async');

var firstTime = false;

var Property = require('../app/Property.js');

process.on('uncaughtException', function(error) {
	console.log(error.stack);
});

var missingBlocks = [];
var prefix = 'ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_DataGrid1_ctl';
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
	if (err1) throw err1;

	var collection = db.collection('property');
	var queue = [],
		x = 0;
	var cvsrs = csv.createStream();
	//queue.push({block:'0023'});
	var rs = fs.createReadStream('./data/block.csv', {
			autoClose: true
		}).pipe(cvsrs)
		.on('error', function(err) {
			console.error(err);
		})
		.on('end', function() {
			queue.push({
				done: true
			});
			async.eachSeries(queue, function(data, callback) {
				if (data.done) {
					if (missingBlocks.length > 0) {
						console.log('Missing Blocks: ' + missingBlocks.join(', '));
					}
					console.log('done');
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
								var inserts = [];

								for (var i = 2; i < 52; i++) {
									var inc = (i < 10) ? '0' + i : i,
										lot = '',
										address = '',
										owner1 = '',
										owner2 = '',
										owner3 = '',
										owner4 = '',
										owner_address = '',
										owner_city = '',
										owner_state = '',
										owner_zip = '';

									page('#' + prefix + inc + '_lblOwner1').closest('td').prev().prev().prev().each(function() {
										item_block = page(this).text().trim();
									});
									page('#' + prefix + inc + '_lblOwner1').closest('td').prev().prev().each(function() {
										lot = page(this).text().trim();
									});
									if (lot.trim() == '') {
										//console.log('Lot #'+(i-1)+' does not exist on block #'+block);
									} else {
										page('#' + prefix + inc + '_lblOwner1').closest('td').prev().each(function() {
											address = page(this).text();
										});
										page('#' + prefix + inc + '_lblOwner1').each(function() {
											owner1 = page(this).text();
										});
										page('#' + prefix + inc + '_lblOwner2').each(function() {
											owner2 = page(this).text();
										});
										page('#' + prefix + inc + '_lblOwner3').each(function() {
											owner3 = page(this).text();
										});
										page('#' + prefix + inc + '_lblOwner4').each(function() {
											owner4 = page(this).text();
										});

										// get rid of those stupid periods, they are inconsistently used in the data, so add no value
										address = address.replace('.', '').trim();
										owner1 = owner1.replace('.', '').trim();
										owner2 = owner2.replace('.', '').trim();
										owner3 = owner3.replace('.', '').trim();
										owner4 = owner4.replace('.', '').trim();

										var prop = new Property();
										prop.createFromRaw({
											block: item_block,
											lot: lot,
											address: address,
											owner1: owner1,
											owner2: owner2,
											owner3: owner3,
											owner4: owner4
										});

										var entry = prop.getData();

										entry.owner1 = owner1;
										entry.owner2 = owner2;
										entry.owner3 = owner3;
										entry.owner4 = owner4;

										if (!firstTime) {
											var resp = collection.update({
												_id: item_block + lot
											}, entry, {
												upsert: true,
												safe: true,
												multi: false
											}, function() {
												setImmediate(function() {
													callback();
												});
											});
										} else {
											inserts.push(entry);
										}


									}

								}

								if (firstTime) {

									collection.insert(inserts, {
										w: 1
									}, function(err, result) {
										if (err) {
											console.log(err);
										} else {
											console.log(result[0].block + ', ' + result.length);
											inserts = [];
										}
										setImmediate(function() {
											callback();
										});
									});

								}

							}
						});
					}
				}
			});
		})
		.on('data', function(data) {

			queue.push(data);

		});
});