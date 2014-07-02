$(function() {

	$(window).resize(function() {
		$('#map').css({
			'width': (($(window).width()) - 260) + 'px',
			'height': (($(window).height())) + 'px'
		});
		map.invalidateSize();
	});

	var map = L.map('map').setView([39.2854197594374, -76.61796569824219], 12);

	$('#map').css({
		'width': (($(window).width()) - 260) + 'px',
		'height': (($(window).height())) + 'px'
	});
	map.invalidateSize();

	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
	}).addTo(map);

	var parcels, parcels2;
	var refreshParcels = function() {
		$('#status').html('Loading...');
		var bounds = map.getBounds();
		$.ajax({
			url: "/api/bounds",
			data: {
				bbox: bounds.getSouth() + ',' + bounds.getWest() + ',' + bounds.getNorth() + ',' + bounds.getEast()
			}
		}).done(function(data) {
			if (parcels) {
				map.removeLayer(parcels);
			}
			parcels = L.geoJson(data, {
				style: function(feature) {
					var color = (feature.properties.primary_owner_name) ? '#00f' : '#0f0';
					return {
						color: color
					};
				},
				onEachFeature: function(feature, layer) {
					var msg = '';
					for (prop in feature.properties) {
						msg = msg + prop + ': ' + feature.properties[prop] + '<br/>';
					}
					layer.bindPopup(msg);
				}
			});
			parcels.addTo(map);
			$('#status').html('Ready');
		});
	};

	map.on('moveend', refreshParcels);
	map.on('zoomend', refreshParcels);

	$('#owner_name').on('keyup', function() {
		var owner_name = $('#owner_name').val().trim();
		if (owner_name) {
			$('#status').html('Loading...');
			$.ajax({
				url: "/api/owner",
				data: {
					owner_name: owner_name
				}
			}).done(function(data) {
				if (parcels2) {
					map.removeLayer(parcels2);
				}
				parcels2 = L.geoJson(data, {
					style: function(feature) {
						return {
							color: "#000"
						};
					},
					onEachFeature: function(feature, layer) {
						var msg = '';
						for (prop in feature.properties) {
							msg = msg + prop + ': ' + feature.properties[prop] + '<br/>';
						}
						layer.bindPopup(msg);
					}
				});
				parcels2.addTo(map);
				$('#status').html('Ready');
			});
		}
	});

	$('#multipoly').on('click', function() {
		$('#status').html('Loading...');
		$.ajax({
			url: "/api/type?type=UNKNOWN"
		}).done(function(data) {
			if (parcels2) {
				map.removeLayer(parcels2);
			}
			parcels2 = L.geoJson(data, {
				style: function(feature) {
					return {
						color: "#F00"
					};
				},
				onEachFeature: function(feature, layer) {
					var msg = '';
					for (prop in feature.properties) {
						msg = msg + prop + ': ' + feature.properties[prop] + '<br/>';
					}
					layer.bindPopup(msg);
				}
			});
			parcels2.addTo(map);
			$('#status').html('Ready');
		});
	});
});