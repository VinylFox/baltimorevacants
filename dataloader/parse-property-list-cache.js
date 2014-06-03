var cheerio = require('cheerio');
var fs = require('fs');
var csv = require('csv-stream');
var request = require('request');
var async = require('async');

var Property = require('../app/Property.js');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
});

var missingBlocks = [];
var prefix = 'ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_DataGrid1_ctl';
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
  if(err1) throw err1;

	var collection = db.collection('property');
	var queue = [], x = 0;
	var cvsrs = csv.createStream();
	var rs = fs.createReadStream('./data/block.csv', {
		autoClose: true
	}).pipe(cvsrs)
	    .on('error',function(err){
	        console.error(err);
	    })
	    .on('end', function(){
	    	queue.push(function(){
	    		if (missingBlocks.length > 0){
		    		console.log('Missing Blocks: '+missingBlocks.join(', '));
		    	}
	    	});
	    	async.eachSeries(queue, function(data, callback){
	    		if (data.block){
					var block = data.block.trim();

					block = (block.length == 1)?'000'+block:block;
					block = (block.length == 2)?'00'+block:block;
					block = (block.length == 3)?'0'+block:block;

			    	fs.readFile('./cache/block-list-'+block+'.html', 'utf-8', function(err2, contents) {
						if (err2) {
							//console.log(err2);
							if (block){
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

								page('#' + prefix + inc + '_lblOwner1').closest('td').prev().prev().each(function() {
									lot = page(this).text();
								});
								if (lot.trim() == ''){
									//console.log('Lot #'+(i-1)+' does not exist on block #'+block);
								}else{
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
									owner1 = owner1.replace('.', '').trim();
									owner2 = owner2.replace('.', '').trim();
									owner3 = owner3.replace('.', '').trim();
									owner4 = owner4.replace('.', '').trim();

									var owner_occupied = (owner1.indexOf('MAYOR') == -1 && (address == owner2 || address == owner3))?true:false;
									var city_owned = (owner1.indexOf('MAYOR') != -1 || owner1.indexOf('HOUSING AUTHORITY') != -1)?true:false;

									if (!owner_occupied && !city_owned){
										if (looksLikeAnAddress(owner2)){
											owner_address = owner2;
										}else if(looksLikeAnAddress(owner3)) {
											owner_address = owner3;
										}else if(looksLikeAnAddress(owner4)) {
											owner_address = owner4;
										}else{
											owner_address = "";
										}
									} else{
										owner_address = "";
									}

									if (owner_address != ''){
										var addrArr = splitAddressCityStateZip(owner3, owner4);
										owner_city = addrArr[0];
										owner_state = addrArr[1];
										owner_zip = addrArr[2];
									}

									if (!city_owned){
										var ownerArr = findOwners(owner1, owner2, owner3);
										primary_owner_name = ownerArr[0];
										secondary_owner_name = ownerArr[1];
										tertiary_owner_name = ownerArr[2];
									}else{
										if (owner1.indexOf('MAYOR') != -1){
											primary_owner_name = 'MAYOR & CITY COUNCIL';
										}else if(owner1.indexOf('HOUSING AUTHORITY') != -1){
											primary_owner_name = 'HOUSING AUTHORITY OF BALTIMORE CITY';
										} else {
											primary_owner_name = owner1.trim();
										}
										secondary_owner_name = '';
										tertiary_owner_name = '';
									}

									var entry = {
										_id: block.trim()+lot.trim(),
							        	block: block.trim(),
							        	lot: lot.trim(),
							        	property_address: address.trim(),
							        	owner_occupied: owner_occupied,
							        	city_owned: city_owned,
							        	primary_owner_name: primary_owner_name,
							        	secondary_owner_name: secondary_owner_name,
							        	tertiary_owner_name: tertiary_owner_name,
							        	owner_address: owner_address,
							        	owner_city: owner_city,
							        	owner_state: owner_state,
							        	owner_zip: owner_zip,
							        	owner1: owner1,
							        	owner2: owner2,
							        	owner3: owner3,
							        	owner4: owner4
							        };

							        inserts.push(entry);

								}

							}

							collection.insert(inserts, {w:1}, function(err, result){
								if (err){
									console.log(err);
								} else {
									console.log(result[0].block+', '+result.length);
									inserts = [];
								}
							    setImmediate(function() { 
							  	    callback(); 
							    });
							});

						}
					});
				}
	    	});
	    })
	    .on('data',function(data){
		    	
			queue.push(data);

	    });
});