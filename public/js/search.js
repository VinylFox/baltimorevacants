var SearchItem = React.createClass({
	handleClick: function(e) {
		console.log(e);
	},
	render: function() {
		return (React.DOM.button({
			text: (this.context) ? this.context.properties.owner1 : 'None',
			onClick: this.handleClick
		}));
	}
});


var SearchItemList = React.createClass({
	getInitialState: function() {
		return {};
	},
	whenClicked: function(e) {
		console.log(e);
	},
	render: function() {
		return (SearchItem({
			clicked: this.whenClicked
		}));
	}
});

var Search = React.createClass({
	displayName: 'Search',
	keyUpWaitTime: 600,
	getInitialState: function() {
		return {
			term: '',
			items: []
		};
	},
	getTerm: function() {
		return this.getState().term;
	},
	setTerm: function(term) {
		this.setState({
			term: term
		});
	},
	componentDidMount: function() {

	},
	doSearch: function(term) {
		var me = this;
		console.log('doing search:', term);
		$.ajax({
			url: "/api/owner",
			data: {
				owner_name: term
			}
		}).done(function(data) {
			console.log(data);
			me.setState({
				items: data.features
			});
			me.props.map.addSearchResults.call(me.props.map, data);
			/*if (parcels2) {
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
			parcels2.addTo(map);*/
		});
	},
	onChange: function(e) {
		var me = this,
			fld = $(e.target),
			val = fld.val();
		this.setTerm(val);
		if (this.timer) {
			clearTimeout(this.timer);
		}
		if (val && val.length > 2) {
			this.timer = setTimeout(function() {
				me.doSearch(fld.val());
			}, this.keyUpWaitTime);
		}
	},
	render: function() {
		return (
			React.DOM.div(null,
				React.DOM.input({
					onChange: this.onChange,
					value: this.state.term
				}),
				SearchItemList({
					items: this.state.items
				})
			)
		);
	}
});

/*
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
*/