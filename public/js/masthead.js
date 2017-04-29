app.factory('MovieRetriever', ($http, $q, $timeout) => {
	var MovieRetriever = new Object();

	MovieRetriever.getmovies = i => {
		var moviedata = $q.defer();
		var movies;

		$http.get("/api/neighborhood?name=" + i).success((data, status) => {
			moviedata.resolve(data.data);
		});

		return moviedata.promise
	}

	return MovieRetriever;
});

app.controller('MastheadController', ["$scope", "$http", "MovieRetriever",

	($scope, $http, MovieRetriever) => {

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
				data,
				style,
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
		$scope.movies.then(data => {
			$scope.movies = data;
		});

		$scope.getmovies = () => $scope.movies

		$scope.doSomething = typedthings => {
			console.log("Do something like reload data with this: " + typedthings);
			$scope.newmovies = MovieRetriever.getmovies(typedthings);
			$scope.newmovies.then(data => {
				$scope.movies = data;
			});
		}

		$scope.doSomethingElse = suggestion => {
			console.log("Suggestion selected: " + suggestion);
		}

	}
]);