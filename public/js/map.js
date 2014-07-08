var app = angular.module("vacants", ["leaflet-directive", "autocomplete", 'ngSanitize']);

app.factory('SearchRetriever', function($http, $q, $timeout) {
	var SearchRetriever = new Object();

	SearchRetriever.getProperties = function(term) {
		console.log('DO SEARCH');
		var deferred = $q.defer(),
			request = "/api/owner?owner_name=" + term;
		$http.get(request).success(function(data) {
			// the promise gets resolved with the data from HTTP
			console.log('DONE SEARCH');
			//deferred.resolve(data);
		});
		// return the promise
		return deferred.promise;
	}

	return SearchRetriever;
});

app.factory('MovieRetriever', function($http, $q, $timeout) {
	var MovieRetriever = new Object();

	MovieRetriever.getmovies = function(i) {
		var moviedata = $q.defer();
		var movies;

		var someMovies = ["The Wolverine", "The Smurfs 2", "The Mortal Instruments: City of Bones", "Drinking Buddies", "All the Boys Love Mandy Lane", "The Act Of Killing", "Red 2", "Jobs", "Getaway", "Red Obsession", "2 Guns", "The World's End", "Planes", "Paranoia", "The To Do List", "Man of Steel"];

		var moreMovies = ["The Wolverine", "The Smurfs 2", "The Mortal Instruments: City of Bones", "Drinking Buddies", "All the Boys Love Mandy Lane", "The Act Of Killing", "Red 2", "Jobs", "Getaway", "Red Obsession", "2 Guns", "The World's End", "Planes", "Paranoia", "The To Do List", "Man of Steel", "The Way Way Back", "Before Midnight", "Only God Forgives", "I Give It a Year", "The Heat", "Pacific Rim", "Pacific Rim", "Kevin Hart: Let Me Explain", "A Hijacking", "Maniac", "After Earth", "The Purge", "Much Ado About Nothing", "Europa Report", "Stuck in Love", "We Steal Secrets: The Story Of Wikileaks", "The Croods", "This Is the End", "The Frozen Ground", "Turbo", "Blackfish", "Frances Ha", "Prince Avalanche", "The Attack", "Grown Ups 2", "White House Down", "Lovelace", "Girl Most Likely", "Parkland", "Passion", "Monsters University", "R.I.P.D.", "Byzantium", "The Conjuring", "The Internship"]

		if (i && i.indexOf('T') != -1)
			movies = moreMovies;
		else
			movies = moreMovies;

		$timeout(function() {
			moviedata.resolve(movies);
		}, 1000);

		return moviedata.promise
	}

	return MovieRetriever;
});

app.controller('MastheadController', ["$scope", "$http", "MovieRetriever",

	function($scope, $http, MovieRetriever) {

		var data = {
			"type": "FeatureCollection",
			"features": [{
				"type": "Feature",
				"properties": {
					"Housing": 0,
					"ID": 0.0,
					"AREA": 2562713344.0,
					"PERIMETER": 207126.51563,
					"BOUNDARY_": 2.0,
					"BOUNDARY_I": 0.0,
					"LENGTH": 207126.513,
					"Shape_Leng": 207126.513062
				},
				"geometry": {
					"type": "LineString",
					"coordinates": [
						[1393953.124839022755623, 621187.937337517738342],
						[1445298.12483911216259, 621406.812555938959122],
						[1445550.62499026954174, 562274.500046521425247],
						[1439943.500049695372581, 557733.624941930174828],
						[1430304.499970778822899, 561653.249976679682732],
						[1422347.375137031078339, 571187.937600180506706],
						[1394098.999875351786613, 586906.812658429145813],
						[1393953.124839022755623, 621187.937337517738342]
					]
				}
			}]
		};

		function style(feature) {
			return {
				fillColor: "#FF0000",
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7
			};
		}

		angular.extend($scope, {
			center: {
				lat: 39.2854197594374,
				lng: -76.61796569824219,
				zoom: 8
			},
			geojson: {
				data: data,
				style: style,
				resetStyleOnMouseout: true
			},
			defaults: {
				attributionControl: false,
				zoomControl: false,
				disablePan: true,
				disableZoom: true
			}
		});

		$scope.movies = MovieRetriever.getmovies("...");
		$scope.movies.then(function(data) {
			$scope.movies = data;
		});

		$scope.getmovies = function() {
			return $scope.movies;
		}

		$scope.doSomething = function(typedthings) {
			console.log("Do something like reload data with this: " + typedthings);
			$scope.newmovies = MovieRetriever.getmovies(typedthings);
			$scope.newmovies.then(function(data) {
				$scope.movies = data;
			});
		}

		$scope.doSomethingElse = function(suggestion) {
			console.log("Suggestion selected: " + suggestion);
		}

	}
]);

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