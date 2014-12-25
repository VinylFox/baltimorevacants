var config = {},
	map,
	search;

config.cityOutlineGeoJson = {
	"type": "Feature",
	"properties": {
		"AREA": 2562713344.0
	},
	"geometry": {
		"type": "LineString",
		"coordinates": [
			[-76.711293669970217, 39.371957030672938],
			[-76.52967423510151, 39.371971900043278],
			[-76.529858300949158, 39.209622953304475],
			[-76.549725312649713, 39.197233450625106],
			[-76.583673126628199, 39.208120531796183],
			[-76.61161075881013, 39.234394547529099],
			[-76.711161349110256, 39.277838496606982],
			[-76.711293669970217, 39.371957030672938]
		]
	}
};

config.defaultMapCenter = {
	lat: 39.2854197594374,
	lon: -76.61796569824219,
	zoom: 12
};

$(window).resize(function() {
	$('#map').css({
		'width': $(window).width() + 'px',
		'height': $(window).height() + 'px'
	});
});

$(function() {
	map = React.renderComponent(MainMap({
		tileServerUrl: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
		//tileServerUrl: 'http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg',
		tileMaxZoom: 22,
		tileAttribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
	}), document.getElementById('mainmap'));
	search = React.renderComponent(Search({
		map: map
	}), document.getElementById('search'));
});