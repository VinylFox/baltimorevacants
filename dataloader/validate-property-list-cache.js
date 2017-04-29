var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');

var path = './cache';

fs.readdir(path, (err, filenames) => {
	console.log(filenames.length);
	async.eachSeries(filenames, (data, callback) => {
		//console.log(data);
		//console.log(data.indexOf('.html'));
		if (data && data.indexOf('.html') > 0){
			fs.readFile('./cache/'+data, 'utf-8', (err2, contents) => {
				if (!err2){
					//console.log(contents);
					var page = cheerio.load(contents);
					var block;
					page('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_DataGrid1_ctl02_lblOwner1').closest('td').prev().prev().prev().each(function() {
						console.log(data, page(this).text());
						block = page(this).text().trim();
					});
					fs.rename('./cache/'+data, './cache/block-list-'+block+'.html', () => {});
					setImmediate(() => { 
				  	    callback(); 
				    });
				} else {
					throw err2;
					setImmediate(() => { 
				  	    callback(err2); 
				    });
				}
			});
		} else{
			setImmediate(() => { 
		  	    callback(); 
		    });
		}
	});
});