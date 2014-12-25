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

var helpers = {
	isAddress: function(val) {
		return /\d .* (ST|AVE|PL|CIR|AL|ROAD|BLVD|UNIT.*|NORTHWAY|SOUTHWAY)/.test(val);
	},
	getBlock: function(texts, i) {
		var block = unescape(texts[i-1].R[0].T).trim().substr(0,5).trim();
		if (block.length > 3){
			return block;
		} else {
			return unescape(texts[i-2].R[0].T).trim().substr(0,5).trim()
		}
	},
	getLot: function(texts, i) {
		var lot = unescape(texts[i-1].R[0].T).trim().substr(5,4).trim();
		if (!lot){
			lot = unescape(texts[i-1].R[0].T).trim();
		}
		return lot;
	},
	getZip: function(texts, i) {
		if (unescape(texts[i+2].R[0].T).trim() == '-') {
			if (this.isZip(unescape(texts[i+3].R[0].T).trim())){
				return unescape(texts[i+1].R[0].T).trim()+"-"+unescape(texts[i+3].R[0].T).trim();
			} else {
				return unescape(texts[i+1].R[0].T).trim();
			}
		} else {
			return unescape(texts[i+1].R[0].T).trim();
		}
	},
	getNeighborhood: function(texts, i) {
		if (unescape(texts[i+2].R[0].T).trim() == '-') {
			if (!this.isType(unescape(texts[i+4].R[0].T).trim())){
				return unescape(texts[i+4].R[0].T).trim();
			} else {
				return unescape(texts[i+3].R[0].T).trim();
			}
		} else {
			if (!this.isType(unescape(texts[i+2].R[0].T).trim())){
				return unescape(texts[i+2].R[0].T).trim();
			} else {
				return unescape(texts[i+1].R[0].T).trim();
			}
		}
	},
	getType: function(texts, i){
		for (var k = 2; k < 10; k++){
			if (this.isType(unescape(texts[i+k].R[0].T).trim())){
				var type = unescape(texts[i+k].R[0].T).trim();
				if (this.isType(unescape(texts[i+k+1].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i+k+1].R[0].T).trim();
				}
				if (this.isType(unescape(texts[i+k+2].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i+k+2].R[0].T).trim();
				}
				if (this.isType(unescape(texts[i+k+3].R[0].T).trim())) {
					type = type + ' ' + unescape(texts[i+k+3].R[0].T).trim();
				}
				return type;
			}
		}
		return null;
	},
	isType: function(val){
		return /(Vacant|Building|Lot|Commercial|Vacant Building|Vacant Lot|Commercial-Vacant Building)/.test(val);
	},
	getZoning: function(texts, i){
		for (var k = 2; k < 10; k++){
			if (texts[i+k] && this.isZoningStart(unescape(texts[i+k].R[0].T).trim())){
				if (texts[i+k+3] && unescape(texts[i+k+3].R[0].T).trim() == "-") {
					if (texts[i+k+2] && texts[i+k+4]){
						return unescape(texts[i+k].R[0].T).trim()+"-"+unescape(texts[i+k+2].R[0].T).trim()+"-"+unescape(texts[i+k+4].R[0].T).trim();
					}
				} else {
					if (texts[i+k+2]) {
						return unescape(texts[i+k].R[0].T).trim()+"-"+unescape(texts[i+k+2].R[0].T).trim();
					}
				}
			}
		}
		return null;
	},
	isZoningStart: function(val){
		return (val == 'B' || val == 'R' || val == 'M' || val == 'O' || val == 'TBD');
	},
	isZip: function(val){
		return /\d/.test(val);
	},
	getId: function(texts, i){
		var id = unescape(texts[i-2].R[0].T).trim(),
			block = this.getBlock(texts, i);
		if (id == block){
			id = unescape(texts[i-3].R[0].T).trim()
		}
		return id;
	},
	isNextId: function(val, id){
		return (parseInt(val, 10) == (parseInt(id, 10) + 1));
	},
	getPrice: function(texts, i){
		var id = this.getId(texts, i);
		for (var k = 4; k < 14; k++){
			if (texts[i+k-1] && texts[i+k] && this.isNextId(unescape(texts[i+k].R[0].T).trim(), id)){
				var price = parseInt(unescape(texts[i+k-1].R[0].T).trim(), 10);
				if (price > 999){
					return parseInt(unescape(texts[i+k-1].R[0].T).trim(), 10);
				}
			}
		}
		return null
	}
};

var processData = function(){

	var pdfParser = new PDFParser();

	var _onPFBinDataReady = function(pdf){
		var list = '';
		console.log('processing '+pdf.data.Pages.length+' pages of vacants');
		for (var x = 0; x < pdf.data.Pages.length; x++){
			console.log('on page '+x);
			//if (x < 8) {
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

					if (helpers.isAddress(val)){
						prop.address = val;
						prop.id = helpers.getId(texts, i);
						prop.block = helpers.getBlock(texts, i);
						prop.lot = helpers.getLot(texts, i);
						prop.zip = helpers.getZip(texts, i);
						prop.neighborhood = helpers.getNeighborhood(texts, i);
						prop.zoning = helpers.getZoning(texts, i);
						prop.type = helpers.getType(texts, i);
						prop.price = helpers.getPrice(texts, i);
						console.log(prop);
					}
				    l++;
				});
			//}
		}
	};

	var _onPFBinDataError = function(){
		console.log(arguments);
	};

	pdfParser.on("pdfParser_dataReady", _.bind(_onPFBinDataReady, this));

	pdfParser.on("pdfParser_dataError", _.bind(_onPFBinDataError, this));

	var pdfFilePath = salesPdf;

	pdfParser.loadPDF(pdfFilePath);

};

processData();