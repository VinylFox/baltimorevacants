app.factory('MovieRetriever', function($http, $q, $timeout) {
	var MovieRetriever = new Object();

	MovieRetriever.getmovies = function(i) {
		var moviedata = $q.defer();
		var movies;

		$http.get("/api/neighborhood?name=" + i).success(function(data, status) {
			moviedata.resolve(data.data);
		});

		return moviedata.promise
	}

	return MovieRetriever;
});

app.controller('MastheadController', ["$scope", "$http", "MovieRetriever",

	function($scope, $http, MovieRetriever) {

		var data = cityOutlineGeoJson;

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
			center: defaultMapCenter,
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