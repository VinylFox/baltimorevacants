var cheerio = require('cheerio');
var fs = require('fs');
var request = require('request');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;

var cookieVal = "aa638f0430d62443009967204933ab0da62808b34cd1.e38ObheKb3aPbi0LbheRbxySbhyOe6fznA5Pp7ftolbGmkTy";
var j = request.jar();
var cookie = request.cookie('JSESSIONID=' + cookieVal);
var url = 'http://casesearch.courts.state.md.us';
var page = '/inquiry/inquiryDetail.jis';
var region = '24';
var casetype = 'C'; // foreclosure = O, tax sale = C

console.log('starting');

var propMap = {
	"Case Number:": "caseNo",
	"Title:": "title",
	"Case Type:": "caseType",
	"Filing Date:": "fileDate",
	"Case Status:": "status",
	"Case Disposition:": "disposition",
	"Disposition Date:": "dispositionDate",
	"Party Type:": [{
		"value": "parties",
		"Party No.:": "num"
	}],
	"Doc No./Seq No.:": [{
		"value": "documents"
	}],
	"Court System:": "courtSystem"
};

//docnum, filedate, entereddate, decision, partytype, partyno, name, note

var documentDefaultOffsets = [+1, +3, +5, +7, +9, +11, +13, +15];

//partytype, partyno, name, address

var partyDefaultOffsets = [+1, +3, +5, +7];

MongoClient.connect('mongodb://127.0.0.1:27017/baltimorevacants', function(err1, db) {
	if (err1) throw err1;

	var collection = db.collection('cases');

	j.setCookie(cookie, url, function() {

		console.log('set cookie');

		var queue = [];
		var startCase = 4000;
		var done = false;

		for (var i = startCase; i <= 6100; i++) {
			queue.push("14" + ("000000" + i).substr(-6, 6));
		}



		async.eachSeries(queue, function(data, callback) {

			//console.log('case id ' + data);

			var caseid = data;
			console.log('requesting case ' + region + casetype + caseid);

			request({
				url: url + page + '?caseId=' + region + casetype + caseid + '&detailLoc=CC',
				jar: j
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var page = cheerio.load(body);
					var els = page('td > span');
					var caseObj = {};

					els.each(function(idx, itm) {
						var el = page(this).text().trim();
						if (propMap[el]) {
							if (typeof propMap[el] !== 'object') {
								caseObj[propMap[el]] = page(els[idx + 1]).text().trim();
							} else {
								//docnum, filedate, entereddate, decision, partytype, partyno, name, note
								var itmObj = {};
								if (propMap[el][0].value === 'documents') {
									itmObj['num'] = page(els[idx + documentDefaultOffsets[0]]).text().trim();
									itmObj['fileDate'] = page(els[idx + documentDefaultOffsets[1]]).text().trim();
									itmObj['enteredDate'] = page(els[idx + documentDefaultOffsets[2]]).text().trim();
									if (page(els[idx + documentDefaultOffsets[3]]).text().trim() !== '') {
										itmObj['decision'] = page(els[idx + documentDefaultOffsets[3]]).text().trim();
									}
									if (page(els[idx + documentDefaultOffsets[4] - 1]).text().trim() === 'Party Type:') {
										itmObj['partyType'] = page(els[idx + documentDefaultOffsets[4]]).text().trim();
										itmObj['partyNum'] = page(els[idx + documentDefaultOffsets[5]]).text().trim();
										itmObj['name'] = page(els[idx + documentDefaultOffsets[6]]).text().trim();
										if (page(els[idx + documentDefaultOffsets[7]]).text().trim() !== '') {
											itmObj['note'] = page(els[idx + documentDefaultOffsets[7]]).text().trim();
										}
									} else if (page(els[idx + documentDefaultOffsets[4] - 1]).text().trim() === 'Document Name:') {
										itmObj['name'] = page(els[idx + documentDefaultOffsets[4]]).text().trim();
										if (page(els[idx + documentDefaultOffsets[5]]).text().trim() !== '') {
											itmObj['note'] = page(els[idx + documentDefaultOffsets[5]]).text().trim();
										}
									}
								} else if (propMap[el][0].value === 'parties') {
									//console.log(page(els[idx + 4]).text().trim());
									if (page(els[idx + 4]).text().trim() !== 'Document Name:' && page(els[idx + 14]).text().trim() !== 'Document Name:') {
										//partytype, partyno, name
										itmObj['partyType'] = page(els[idx + documentDefaultOffsets[0]]).text().trim();
										itmObj['partyNum'] = page(els[idx + documentDefaultOffsets[1]]).text().trim();
										itmObj['name'] = page(els[idx + documentDefaultOffsets[2]]).text().trim();
										if (page(els[idx + documentDefaultOffsets[2] + 1]).text().trim() === 'Address:') {
											itmObj['address'] = page(els[idx + documentDefaultOffsets[3]]).text().trim() +
												', ' + page(els[idx + documentDefaultOffsets[3] + 2]).text().trim() +
												', ' + page(els[idx + documentDefaultOffsets[3] + 4]).text().trim() +
												' ' + page(els[idx + documentDefaultOffsets[3] + 6]).text().trim();
										}
									}
								}
								if (!caseObj[propMap[el][0].value]) {
									caseObj[propMap[el][0].value] = [];
								}
								if (itmObj.name) {
									caseObj[propMap[el][0].value].push(itmObj);
								}
							}
						}
					});

					//console.log(caseObj);

					if (caseObj.caseNo) {

						caseObj._id = caseObj.caseNo;

						collection.update({
							_id: caseObj._id
						}, caseObj, {
							upsert: true
						}, function() {
							console.log('udated/inserted case');
							setTimeout(function() {
								callback();
							}, 500);
						});

					} else {
						setTimeout(function() {
							callback();
						}, 500);
					}

				} else {
					console.log('error page');
					setTimeout(function() {
						callback();
					}, 500);
				}
			});

		});

	});
});