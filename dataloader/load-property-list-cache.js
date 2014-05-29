var cheerio = require('cheerio');
var fs = require('fs');
var csv = require('csv-stream');
var request = require('request');
var async = require('async');

fs.readFile('./pagestate.txt', 'utf-8', function(err2, contents) {
	if (err2) throw err2;

	var queue = [],
		pagestate = contents;

	var cvsrs = csv.createStream();
	var rs = fs.createReadStream('./data/missing-block.csv', {
		autoClose: true
	}).pipe(cvsrs)
	    .on('error',function(err){
	        console.error(err);
	    })
	    .on('end', function(){
	    	async.eachSeries(queue, function(data, callback){

	    		console.log(data);

				var block = data.block+"";

				block = (block.length == 1)?'000'+block:block;
				block = (block.length == 2)?'00'+block:block;
				block = (block.length == 3)?'0'+block:block;

				request.post(
				    'http://cityservices.baltimorecity.gov/realproperty/default.aspx',
				    { 
				    	form: { 
				    		"ctl00_ctl00_ScriptManager1_HiddenField":";;System.Web.Extensions, Version=1.0.61025.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35:en-US:1f0f78f9-0731-4ae9-b308-56936732ccb8:52817a7d:67c678a8",
							"__EVENTTARGET":"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$DataGrid1$ctl08$lnkBtnSelect",
							"__EVENTARGUMENT":"",
							"__VIEWSTATE": pagestate,
							"ctl00$ctl00$txtGoogleCustomSearch":"Keyword or Search",
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$ddYears":"2014",
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$txtBlock":block,
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$txtLot":"",
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$txtAddress":"",
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$txtOwner":"",
							"ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$btnSearch":"Search"
				    	} 
				    },
				    function (error, response, body) {
				        if (!error && response.statusCode == 200) {
				        	fs.writeFile("./cache/block-list-"+block+".html", body, function(err) {
							    if(err) {
							        console.log("Error on block "+block+"!",err);
							        setImmediate(function() { 
									  	callback(err); 
									});
							    } else {
							        console.log("Block "+block+" was saved!");
							    	setImmediate(function() { 
									  	callback(); 
									});
							    }
							});
				        }else{
				        	console.log(error);
				        	console.log("Block "+block+" errored!");
				        	setImmediate(function() { 
							  	callback(error); 
							});
				        }
				    }
				);

			});
	    })
	    .on('data',function(data){
	    	queue.push(data);
	    });
});