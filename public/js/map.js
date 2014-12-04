var MainMap = React.createClass({
	displayName: 'MainMap',
	getInitialState: function() {
		return {
			center: config.defaultMapCenter
		};
	},
	setMapCenter: function(lat, lon, zoom) {
		this.setState({
			center: {
				lat: lat,
				lon: lon,
				zoom: zoom
			}
		});
	},
	componentDidMount: function() {
		$('.loading').show();
		$('.hoodinfo').hide();
		$('.propdetails').hide();
		this.createMap();
		this.addTileLayer();
		this.fixMapSize();
		this.createLegend();
		this.addCityOutline();
		this.addNeighborhoodOutlines();
	},
	createMap: function() {
		this.map = L.map('mainmap').setView([this.state.center.lat, this.state.center.lon], this.state.center.zoom);
	},
	createLegend: function() {
		var ME = this;

		this.legend = L.control({
			position: 'bottomleft'
		});

		this.legend.onAdd = function(map) {

			var div = L.DomUtil.create('div', 'info legend'),
				grades = [{
					vacant: true,
					owner_occupied: false,
					label: 'Vacant'
				}, {
					vacant: false,
					owner_occupied: false,
					owner_type: 'RENTAL',
					label: 'Corporate'
				}, {
					vacant: false,
					owner_occupied: true,
					label: 'Individual'
				}, {
					owner_type: 'CHARITY',
					label: 'Charity Org.'
				}, {
					owner_type: 'RELIGIOUS',
					label: 'Religoius Org.'
				}, {
					owner_name1: 'MAYOR & CITY COUNCIL',
					label: 'City'
				}, {
					label: 'Other'
				}],
				labels = [];

			for (var i = 0; i < grades.length; i++) {
				div.innerHTML += '<i style="background:' + ME.getPropertyColor(grades[i]) + ';border: 1px solid ' + ME.getPropertyOutline(grades[i]) + ';"></i> ' + grades[i].label + '<br/>';
			}

			return div;
		};

		this.legend.addTo(this.map);
	},
	addTileLayer: function() {
		L.tileLayer(this.props.tileServerUrl, {
			maxZoom: this.props.tileMaxZoom,
			attribution: this.props.tileAttribution
		}).addTo(this.map);
	},
	fixMapSize: function() {
		$('#mainmap').css({
			'width': $(window).width() + 'px',
			'height': $(window).height() + 'px'
		});
		this.map.invalidateSize();
	},
	addSearchResults: function(data) {
		console.log('results', data.features);
		if (this.search) {
			this.map.removeLayer(this.search);
		}
		this.search = L.geoJson(data).addTo(this.map);
	},
	addCityOutline: function() {
		L.geoJson(config.cityOutlineGeoJson, {
			color: "#ff7800",
			weight: 5,
			opacity: 0.65
		}).addTo(this.map);
	},
	addNeighborhoodOutlines: function() {
		var ME = this;
		$.get("/api/neighborhoodshapes").success(function(data, status) {
			//addDisplayValue(data);
			ME.neighborhoods = L.geoJson(data, {
				style: ME.getNeighborhoodStyle,
				onEachFeature: ME.onEachFeature
			}).addTo(ME.map);
			$('.loading').hide();
		});
	},
	onEachFeature: function(feature, layer) {
		//ME.parcelMap
		layer.on({
			mouseover: this.shapeHover,
			mouseout: this.shapeMouseOut,
			click: this.shapeClick
		});
	},
	getPropertyStyle: function(feature) {
		return {
			fillColor: this.getPropertyColor(feature.properties),
			weight: 1,
			opacity: 1,
			color: this.getPropertyOutline(feature.properties),
			fillOpacity: 0.65
		}
	},
	getNeighborhoodStyle: function(feature) {
		return {
			fillColor: this.getNeighborhoodColor(feature.properties.Vacant, feature.properties.Housing),
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: 3,
			fillOpacity: 0.65
		}
	},
	getPropertyColor: function(p) {
		var color = '#E5E2E0';
		/*if (p.vacant === true) {
			color = '#F00';
		} else*/
		if (p.owner_occupied === true) {
			color = '#137B80';
		} else if (p.owner_type == 'RENTAL') {
			color = '#E6842A';
		} else if (p.owner_type == 'CHARITY') {
			color = '#E3BA22';
		} else if (p.owner_type == 'RELIGIOUS') {
			color = '#F2DA57';
		} else if (p.owner_name1 == 'MAYOR & CITY COUNCIL') {
			color = '#978F80';
		}
		/*else if (p.owner_occupied == false && p.owner_type == 'UNKNOWN') {
			color = '#0066FF';
		}*/

		return color;
	},
	getPropertyOutline: function(p) {
		var color = '#FFF';
		if (p.vacant === true) {
			color = '#BD2D28';
		} else if (p.owner_name1) {
			color = '#0F0';
		}

		return color;
	},
	getNeighborhoodColor: function(d, t) {

		var n = (d == 0 || t < 200) ? 0 : ((((d / t) * 100) - 100) * -1).toFixed(0),
			G = (((255 * n) / 100) - 80).toFixed(0),
			R = ((255 * (100 - n)) / 100).toFixed(0),
			B = '10',
			val = (n > 0) ? 'rgb(' + R + ',' + G + ',' + B + ')' : '#CCCCCC';

		return val;
	},
	shapeHover: function(e) {
		var layer = e.target,
			props = layer.feature.properties,
			html;
		if (props.Name) {
			layer.setStyle({
				weight: 5,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.7
			});
			html = props.Name;
		} else {
			if (props.property_address == 0) {
				if (props.owner_name1) {
					html = 'No address available for this parcel. <br/>Likely an easment, park, or other non-residential or commercial space.<br/>';
					html += 'Owner: ' + props.owner_name1 + '<br/>';
				} else {
					html = 'No address available for this parcel. <br/>Likely an easment, park, or other non-residential or commercial space.';
				}
			} else {
				if (props.owner_name1) {
					html = '<span class="addr">' + props.property_address + '</span><br/>' + props.block + ' ' + props.lot + '<br/>Owner: ' + props.owner_name1 + '<br/>';
					if (props.owner_name2) {
						html += 'Owner 2: ' + props.owner_name2 + '<br/>';
						if (props.owner_name3) {
							html += 'Owner 3: ' + props.owner_name3 + '<br/>';
						}
					}
					if (props.owner_address) {
						html += 'Owner Address: ' + props.owner_address + '. ' + props.owner_city + ', ' + props.owner_state + ' ' + props.owner_zip + '<br/>';
					}
				} else {
					html = '<span class="addr">' + props.property_address + '</span><br/>' + props.block + ' ' + props.lot + '<br/>No details on property<br/>';
				}
			}
		}
		$('.propinfo').html(html);
	},
	shapeMouseOut: function(e) {
		if (e.target.feature.properties.Name) {
			(this.neighborhoods) ? this.neighborhoods.resetStyle(e.target): '';
		}
	},
	shapeClick: function(e) {
		var shape = e.target.feature,
			html,
			props = shape.properties,
			coords = shape.geometry.coordinates;

		$('.propdetails .owner').html('');
		$('.propdetails .viol').html('');
		$('.propdetails .legal').html('');

		if (props.Name) {
			$('.propdetails').animate({
				left: window.innerWidth
			});
			$('.hoodinfo').hide();
			$('.loading').show();
			this.currentNeighborhood = props.Name;
			this.map.fitBounds(e.target.getBounds());
			if (props.Name) {
				var ME = this;

				if (ME.hiddenNeighborhood) {
					ME.map.addLayer(ME.hiddenNeighborhood);
				}
				if (ME.parcels) {
					this.map.removeLayer(ME.parcels);
				}
				ME.hiddenNeighborhood = e.target;
				this.map.removeLayer(e.target);
				var bounds = this.map.getBounds(),
					n = bounds.getNorth(),
					s = bounds.getSouth(),
					e = bounds.getEast(),
					w = bounds.getWest(),
					bbox = n + ',' + w + ',' + s + ',' + e;
				/*$.get("/api/summary?field=owner_name1&bbox=" + bbox).success(function(data, status) {
					var c = 0,
						html = 'Top Owners<br/>';
					$.each(data.data, function(i, item) {
						if (item._id !== null && c < 10) {
							html += item.totalSize + ' : <b>' + item._id + '</b><br/>';
							c++;
						}
					});
					$('.hoodinfo .owners').show().html(html);
				});
				$.get("/api/summary?field=owner_type&bbox=" + bbox).success(function(data, status) {
					var c = 0,
						html = 'Owner Type<br/>';
					$.each(data.data, function(i, item) {
						if (item._id !== null && c < 10 && item._id !== 'UNKNOWN') {
							html += item.totalSize + ' : <b>' + item._id + '</b><br/>';
							c++;
						}
					});
					$('.hoodinfo').show();
					$('.hoodinfo .types').html(html);
				});
				$.get("/api/summary?field=owner_state&bbox=" + bbox).success(function(data, status) {
					var c = 0,
						html = 'Owner State<br/>';
					$.each(data.data, function(i, item) {
						if (item._id !== null && c < 10) {
							html += item.totalSize + ' : <b>' + item._id + '</b><br/>';
							c++;
						}
					});
					$('.hoodinfo').show();
					$('.hoodinfo .states').html(html);
				});*/
				$.get("/api/neighborhood?name=" + this.currentNeighborhood).success(function(data, status) {
					ME.parcels = L.geoJson(data, {
						style: ME.getPropertyStyle,
						onEachFeature: ME.onEachFeature
					}).addTo(ME.map);
					$('.loading').hide();
				});
			}
		} else {

			if (this.curSel == props.block + props.lot) {
				$('.propdetails').animate({
					left: window.innerWidth
				});
				this.curSel = '';
			} else {

				if (props.block && props.lot) {
					var block = (props.block.length < 5) ? props.block + '%20' : props.block,
						lot = (props.lot.length < 4) ? props.lot + '%20' : props.lot,
						url = 'http://data.baltimorecity.gov/resource/ywty-nmtg.json?$select=citation,fineamount,balance,violdesc,violdate,agency,block,lot&block=' + block + '&lot=' + lot,
						viols = '<span class="violationtitle">Violations</span><ul>';
					$.ajax({
						url: url,
						jsonp: '$jsonp'
					}).done(function(data) {
						var existing = [];
						$.each(data, function(i, itm) {
							if (itm.violdesc) {
								var ret = existing.indexOf(itm.citation) !== -1;
								if (!ret) {
									existing.push(itm.citation);
									viols += '<li class="viols">' + itm.violdesc + '</li>';
								}
							}
						});
						$('.propdetails .viol').html(viols + '</ul>');
					});
				}

				$('div.location > .blocklot').html(props.block + ' ' + props.lot);
				$('div.location > .address').html(props.property_address);

				if (props.owner_name1) {
					html = '<br/><span class="ownertitle">Owner (s)</span><br/>Primary: ' + props.owner_name1 + '<br/>';
					if (props.owner_name2) {
						html += 'Secondary: ' + props.owner_name2 + '<br/>';
						if (props.owner_name3) {
							html += 'Terciary: ' + props.owner_name3 + '<br/>';
						}
					}
					if (props.owner_address) {
						html += 'Owner Address: ' + props.owner_address + '. ' + props.owner_city + ', ' + props.owner_state + ' ' + props.owner_zip + '<br/>';
					}

					$('.propdetails .owner').html(html);
					$('.propdetails').show();
					$('.propdetails').animate({
						left: window.innerWidth - 370
					});
					var lat = coords[0][0][0],
						lng = coords[0][0][1];
					this.addSummaryStreetView(lat, lng);
				} else {
					$('.propdetails .owner').html('<br/>No extended owner information available');
					$('.propdetails').show();
					$('.propdetails').animate({
						left: window.innerWidth - 370
					});
				}
			}
			this.curSel = props.block + props.lot;
		}
	},
	addSummaryEarth: function(lat, lng) {

	},
	addSummaryStreetView: function(lat, lng) {

		var latLng = new google.maps.LatLng(lng, lat);
		var panoramaOptions = {
			addressControl: false,
			zoomControl: false,
			panControl: false,
			linksControl: false,
			clickToGo: false,
			position: latLng,
			pov: {
				heading: 165,
				pitch: 0
			},
			zoom: 1
		};
		var myPano = new google.maps.StreetViewPanorama(
			document.getElementById('pano'),
			panoramaOptions);
		myPano.setVisible(true);

	},
	showPanoData: function(panoData, status) {
		if (status != google.maps.StreetViewStatus.OK) {
			$('#pano').html('No StreetView Picture Available').attr('style', 'text-align:center;font-weight:bold').show();
			return;
		}
		$('#pano').show();
		var angle = this.computeAngle(this.addLatLng, panoData.location.latLng);

		var panoOptions = {
			position: this.addLatLng,
			addressControl: false,
			linksControl: false,
			panControl: false,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.SMALL
			},
			pov: {
				heading: angle,
				pitch: 10,
				zoom: 1
			},
			enableCloseButton: false,
			visible: true
		};

		this.panorama.setOptions(panoOptions);
	},
	computeAngle: function(endLatLng, startLatLng) {
		var DEGREE_PER_RADIAN = 57.2957795;
		var RADIAN_PER_DEGREE = 0.017453;

		var dlat = endLatLng.lat() - startLatLng.lat();
		var dlng = endLatLng.lng() - startLatLng.lng();
		// We multiply dlng with cos(endLat), since the two points are very closeby,
		// so we assume their cos values are approximately equal.
		var yaw = Math.atan2(dlng * Math.cos(endLatLng.lat() * RADIAN_PER_DEGREE), dlat) * DEGREE_PER_RADIAN;
		return this.wrapAngle(yaw);
	},
	wrapAngle: function(angle) {
		if (angle >= 360) {
			angle -= 360;
		} else if (angle < 0) {
			angle += 360;
		}
		return angle;
	},
	render: function() {
		return React.DOM.div();
	}
});