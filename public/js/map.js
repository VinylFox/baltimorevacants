app.controller('MapController', ["$scope", "$http", "leafletData",
	function($scope, $http, leafletData) {

		$scope.$on("leafletDirectiveMap.geojsonMouseover", function(ev, leafletEvent) {
			countryMouseover(leafletEvent);
		});

		$scope.$on("leafletDirectiveMap.geojsonClick", function(ev, featureSelected, leafletEvent) {
			countryClick(featureSelected, leafletEvent);
		});

		angular.extend($scope, {
			center: {
				lat: 39.2854197594374,
				lng: -76.61796569824219,
				zoom: 12
			},
			legend: {
				colors: ['#FF0000', '#006699'],
				labels: ['Vacant Houses', 'Search Result']
			}
		});

		function countryClick(country, event) {
			console.log(country.properties.Name);
			$scope.currentNeighborhood = country.properties.Name;
			leafletData.getMap('mainmap').then(function(map) {
				console.log('success', arguments);
				map.fitBounds(event.target.getBounds());
				if (country.properties.Name) {
					$http.get("/api/neighborhood?name=" + country.properties.Name).success(function(data, status) {

						addDisplayValue(data);
						for (var i = 0; i < $scope.allHoodData.features.length; i++) {
							if ($scope.allHoodData.features[i].properties.Name == $scope.currentNeighborhood) {
								if ($scope.removedNeighborhood) {
									$scope.allHoodData.features.concat($scope.removedNeighborhood);
								}
								$scope.removedNeighborhood = $scope.allHoodData.features.splice(i, 1);
							}
						}

						data.features = data.features.concat($scope.allHoodData.features);
						angular.extend($scope, {
							geojson: {
								data: data,
								style: style,
								resetStyleOnMouseout: true
							}
						});
					});

				}
			}, function() {
				console.log('failure', arguments);
			});
		}

		// Get a country paint color from the continents array of colors
		function getColor(country) {
			return "#CC0066";
		}

		function style(feature) {
			return {
				fillColor: (feature.properties.vacant) ? "#FF0000" : (feature.properties.Vacant == 0 || feature.properties.Housing < 200) ? '#ccc' : $scope.color.evaluate(((((feature.properties.Vacant / feature.properties.Housing) * 100) - 100) * -1).toFixed(0)),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7
			};
		}

		// Mouse over function, called from the Leaflet Map Events
		function countryMouseover(leafletEvent) {
			var layer = leafletEvent.target;
			layer.setStyle({
				weight: 2,
				color: '#666',
				fillColor: 'white'
			});
		}

		function addDisplayValue(data) {
			for (i = 0; i < data.features.length; i++) {
				if (data.features[i].properties.Name) {
					data.features[i].DisplayValue = data.features[i].properties.Name + " (" + data.features[i].properties.Vacant + " Vacants of " + data.features[i].properties.Housing + " Houses)";
				} else if (data.features[i].properties.primary_owner_name) {
					data.features[i].DisplayValue = "<p>" + data.features[i].owner_type + " | " + data.features[i].properties.property_address + "</p><p>Owner: " + data.features[i].properties.primary_owner_name + "</p><p>Owner Address: " + data.features[i].properties.owner_address + "</p><p>" + data.features[i].properties.owner_city + ", " + data.features[i].properties.owner_state + " " + data.features[i].properties.owner_zip + "</p>";
				} else {
					data.features[i].DisplayValue = (data.features[i].properties.property_address == '0') ? 'Unknown ownership (Likely an easment or public right of way)' : data.features[i].properties.property_address;
				}
			}
		}

		// Get the countries data from a JSON
		$http.get("/api/neighborhoodlist").success(function(data, status) {

			$scope.allData = data;
			$scope.color = new L.HSLLuminosityFunction(new L.Point(0, 0.3), new L.Point(data.length - 1, 2), {
				outputHue: 0,
				outputLuminosity: '100%'
			})
			// Put the countries on an associative array
			$scope.countries = {};
			for (var i = 0; i < data.length; i++) {
				var country = data[i];
				$scope.countries[country['name']] = country;
			}

			// Get the countries geojson data from a JSON
			$http.get("/api/neighborhoodshapes").success(function(data, status) {
				$scope.allHoodData = data;
				addDisplayValue(data);
				angular.extend($scope, {
					geojson: {
						data: data,
						style: style,
						resetStyleOnMouseout: true
					}
				});
			});
		});
	}
]);

/*	$(window).resize(function() {
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
});*/