var csa_shapes = require('../static/js/csa_shapes.js');
var db = require('mysql2');
var util = require('util');

var sql_feature = 'INSERT INTO geo_feature (id, type, name) VALUES (0, "csa", "%s")';
var sql_feature_point = 'INSERT INTO geo_feature_point (id, geo_feature_id, lat, lon) VALUES (0, %s, %s, %s)';

var conn = new db.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'baltimorevacants'
});

var i = 0, 
	i_len = csa_shapes.features.length,
	k = 0,
	k_len,
	csa_points,
	m = 0,
	m_len;

for (;i < i_len; i++){
	var points = [];
	console.log(csa_shapes.features[i].properties.name);
	csa_points = csa_shapes.features[i].geometry.coordinates[0];
	k_len = csa_points.length;
	k = 0;
    for(;k < k_len; k++){
    	m_len = csa_points[k].length;
    	m = 0;
        for(;m < m_len; m++){
            if (csa_points[k][m].length == 2) {
                points.push([csa_points[k][m][0], csa_points[k][m][1]]);
            }
        };
    };

    createCSAFeature(csa_shapes.features[i].properties.name, points);

	//console.log(points);
}

function createCSAFeature(name, points){
	var sql = util.format(sql_feature, name);
	console.log(sql);
	/*app.db.query(sql, function(err, data2){
		if (err) {
	      console.log(err);
	      throw err;
	    }
		if (data2[0].cnt == 0){
			//app.db.query(util.format(ME.queries.makeinsert, data.address), function(err){
			//	console.log(data.make + ' inserted');
			//});
		}
	});*/
};

function createCSAFeaturePoints(id, points){

};