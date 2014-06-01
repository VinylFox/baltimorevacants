var cheerio = require('cheerio');
var fs = require('fs');
var csv = require('csv-stream');
var request = require('request');
var async = require('async');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
});

var missingBlocks = [];
var prefix = 'ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_DataGrid1_ctl';
var MongoClient = require('mongodb').MongoClient;

function looksLikeCityOwned(str){
	return  (str.indexOf('MAYOR') != -1 || str.indexOf('HOUSING AUTHORITY') != -1);
}

function looksLikeStateOwned(str){
	return  (str.indexOf('MAYOR') != -1 || str.indexOf('HOUSING AUTHORITY') != -1);
}

function looksLikeTransportationOwned(str){
	return  (str.indexOf('CSX') != -1);
}

function normalizeOwnerName(str1, str2, str3){
	return str;
}

function looksLikeAnAddress(str){
	return (/^\d/.test(str) == true || str.indexOf('PO') == 0);
}

function looksLikeCityStateZip(str){
	var splitStr = str.split(' '), 
		numlen = splitStr[splitStr.length-1].replace(/[a-zA-Z, ]/g,'').length;
	return (/^\d/.test(str) == false && /\d$/.test(str.trim()) && str.indexOf('PO') != 0 && str.indexOf('#') == -1 && str.indexOf(' LN ') == -1 && numlen >= 5);
}

function splitAddressCityStateZip(str3, str4){
	var arr = ["","",""], tmp, tmp1, str;
	if (looksLikeCityStateZip(str3)){
		str = str3;
	} else if (looksLikeCityStateZip(str4)){
		str = str4;
	} else {
		str = '';
	}
	tmp1 = str.split(' ');
	tmp = tmp1.filter(function(v){
		return v !== '';
	});
	if (tmp.length > 2 && /\d/.test(tmp[tmp.length-1]) && tmp[tmp.length-2].length == 2){
		arr[1] = tmp[tmp.length-2];
		arr[2] = tmp[tmp.length-1];
		tmp.pop();
		tmp.pop();
		arr[0] = tmp.join(' ');
	}
	return arr;
};

function findOwners(str1, str2, str3){
	// the assumption is that str1 is ALWAYS an owner, the primary owner
	var arr = [str1.trim(),"",""];
	// if str2 does not start or end in a number, then it's likely an owner name, a secondary owner
	if (/^\d/.test(str2) == false && /\d$/.test(str2.trim()) == false){
		arr[1] = str2.trim();
	}
	// if str3 does not start or end in a number and a secondary owner exists, then it's likely an owner name, a tertiary owner
	if (/^\d/.test(str3) == false && /\d$/.test(str3.trim()) == false && arr[1] != ""){
		arr[2] = str3.trim();
	}
	// if the second owner appears to be part of a corporation name, add it to the first line
	if (arr[1].indexOf('DEVELOPMENT') != -1 || arr[1].indexOf('INVESTMENT') != -1 || arr[1].indexOf('CORPORATION') != -1 || arr[1].indexOf('LLC') != -1 || arr[1].indexOf('INC') != -1 || arr[1].indexOf('PROPERTIES') != -1){
		arr[0] = arr[0] + ' ' + arr[1];
		arr[1] = "";
	}
	// if the tertieary owner appears to be part of a corporation name, add it to the first line
	if (arr[2].indexOf('DEVELOPMENT') != -1 || arr[2].indexOf('INVESTMENT') != -1 || arr[2].indexOf('CORPORATION') != -1 || arr[2].indexOf('LLC') != -1 || arr[2].indexOf('INC') != -1 || arr[2].indexOf('PROPERTIES') != -1){
		arr[0] = arr[0] + ' ' + arr[2];
		arr[2] = "";
	}
	return arr;
};

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