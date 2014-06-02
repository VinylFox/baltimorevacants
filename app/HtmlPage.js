var fs = require('fs');

var HtmlPage = function(config){
	for (var prop in config) this[prop] = config[prop];
	this.htmlDir = this.htmlDir || './html/';
}

HtmlPage.prototype.render = function(pageName, cb){
	fs.readFile(this.htmlDir + pageName + '.html', function(err, contents){
		if (err) throw err;
		cb(contents);
	});
};

module.exports = HtmlPage;