var remotePdf = "http://static.baltimorehousing.org/pdf/vtov_list.pdf";
var salesPdf = "./data/vtov_list.pdf";

var nodeUtil = require("util"),
    fs = require('fs'),
    http = require('http'),
    _ = require('underscore'),
    PDFParser = require("pdf2json/pdfparser");

//var file = fs.createWriteStream(salesPdf);

//file.on('finish', function() {
//  file.close(processData);
//});

//http.get(remotePdf, function(response) {
//	response.pipe(file);
//});

/*
 * 11 lines per property
 * property starts on line 7
 */

var processData = function(){

	var pdfParser = new PDFParser();

	var _onPFBinDataReady = function(pdf){
		for (var x = 0; x < pdf.data.Pages.length; x++){
			var page = pdf.data.Pages[x];
			var l = 0;
			var shift = 5;
			var prop = {};
			var zoningContinue = false;
			page.Texts.forEach(function(text) {
				//console.log(text.R);
				var val = unescape(text.R[0].T).trim();
				if (x == 0 && l == 3) {
					console.log('V2V Offerings For '+val);
				} else if (x < 5 && l < 46 && x > 3 && l > shift && !(x == 4 && l < 17)) {
					console.log(((l - shift) % 11)+':'+x+':'+l+':'+val);
					if ((l - shift) % 11 == 1){
						prop = {
							_id: val
						};
			    	} else if ((l - shift) % 11 == 2){
			    		// block lot
			    		prop.block = val.substr(0, 5);
			    		prop.lot = val.substr(5, 4);
			    	} else if ((l - shift) % 11 == 3){
			    		// address
			    		if (val == '-') {
			    			shift++;
			    		} else {
			    			prop.address = val;
			    		}
			    	} else if ((l - shift) % 11 == 4){
			    		// zip code (first part possibly)
			    		if (!prop.zip){
			    			prop.zip = val;
			    		}
			    	} else if ((l - shift) % 11 == 5){
			    		// zip code (if this is a hyphen then we have a multi part zip, otherwise it's the neighborhood)
			    		if (val == '-') {
			    			// ignore the rest of the zip, we dont need it
				    		shift++;
				    		shift++;
				    	} else {
			    			prop.neighborhood = val;
			    		}
			    	} else if ((l - shift) % 11 == 6){
			    		// property type
			    		if (val == '-') {
			    			shift++;
			    			shift++;
			    		} else {
			    			prop.type = val;
			    		}
			    	} else if ((l - shift) % 11 == 7){
			    		// zoning type (or continuance of property type)
			    		if (val == '-') {
			    			shift++;
			    			shift++;
			    		} else {
			    			prop.zoning = val;
			    		}
			    	} else if ((l - shift) % 11 == 8){
			    		// zoning type continued
			    		if (val == '-') {
			    			shift++;
			    		} else {
			    			prop.zoning = prop.zoning + val;
			    		}
			    	} else if ((l - shift) % 11 == 9){
			    		// price
			    		prop.price = val;
			    		console.log(prop);
			    	}
			    }
			    l++;
			});
		}
	};

	var _onPFBinDataError = function(){
		console.log(arguments);
	};

	pdfParser.on("pdfParser_dataReady", _.bind(_onPFBinDataReady, this));

	pdfParser.on("pdfParser_dataError", _.bind(_onPFBinDataError, this));

	var pdfFilePath = salesPdf;

	pdfParser.loadPDF(pdfFilePath);

	// or call directly with buffer
	fs.readFile(pdfFilePath, function (err, pdfBuffer) {
	  if (!err) {
	    pdfParser.parseBuffer(pdfBuffer);
	  }
	});
};

processData();