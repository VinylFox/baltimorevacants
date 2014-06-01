var usMoney = function(n, c) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = ".",
        t = ",",
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var wholeNumber = function(n) {
    if (!isFinite(n)) {
        return n;
    }

    var s = "" + n,
        abs = Math.abs(n),
        _, i;

    if (abs >= 1000) {
        _ = ("" + abs).split(/\./);
        i = _[0].length % 3 || 3;

        _[0] = s.slice(0, i + (n < 0)) +
            _[0].slice(i).replace(/(\d{3})/g, ',$1');

        s = _.join('.');
    }

    return s;
};

var allProps = [],
    ctr, R = 6371,
    strings = {
        geowait: "Loading properties...",
        geofailure: "Failed to load data.",
        geonoresults: "No properties to map in this area",
        bmoreCtrLat: 39.290555,
        bmoreCtrLng: -76.609604,
        cmkey: '15e536b2a81349ea8e08f9a90800dd71',
        address: 'Address',
        neighborhood: 'Neighborhood',
        block: 'Block & Lot',
        type: 'Property Type',
        lat: 'Lattitude',
        lon: 'Longitude',
        distance: 'Dist. From Ctr (meters)'
    }, fn = {
        dataSets: {
            'qqcv-ihn5': true,
            'gf6h-35ki': false,
            'hdyb-27ak': false
        },
        dataSetsLoaded: {
            'qqcv-ihn5': false,
            'gf6h-35ki': false,
            'hdyb-27ak': false
        },
        cache: {
            data: {},
            markers: [],
            layers: [],
            clusters: []
        },
        clusterIcons: [],
        activeIcon: {
            iconUrl: '/static/resources/images/marker.png',
            shadowUrl: '/static/resources/images/marker-shadow.png',
            iconSize: new L.Point(25, 41),
            shadowSize: new L.Point(41, 41),
            iconAnchor: new L.Point(20, 20)
        },
        toTitleCase: function(str) {
            if (str && str.replace) {
                return str.replace(/\w\S*/g, function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            } else {
                return str;
            }
        },
        showMessage: function(msg) {
            $('#search-msg-wrap').removeClass('invalid-wrap');
            $('#search-msg').html(msg);
            $('#lmapcontainer').css({
                opacity: 1
            });
        },
        showWaitMessage: function(msg) {
            $('#search-msg-wrap').removeClass('invalid-wrap');
            $('#lmapcontainer').css({
                opacity: 0.3
            });
            $('#search-msg').html(msg);
        },
        hideWaitMessage: function() {
            $('#lmapcontainer').css({
                opacity: 1.0
            });
            $('#search-msg').html('');
        },
        showErrorMessage: function(msg) {
            $('#search-msg').html(msg);
            $('#lmapcontainer').css({
                opacity: 1
            });
            $('#search-msg-wrap').addClass('invalid-wrap');
        },
        resizePage: function() {
            $('.map-contain').css({
                'width': (($(window).width()) - 260) + 'px',
                'height': (($(window).height())) + 'px'
            });
            $('#lmapcontainer').css({
                'width': (($(window).width()) - 260) + 'px',
                'height': (($(window).height())) + 'px'
            });
            lmap.invalidateSize();
            $('#sb-contents').css({
                'height': (($(window).height()) - 350) + 'px'
            });
        },
        clearMarkers: function() {
            if (this.cache.cluster) {
                this.cache.cluster.clearLayers();
                lmap.removeLayer(this.cache.cluster);
                $.each(this.cache.markers, function(i, mkr) {
                    lmap.removeLayer(mkr);
                });
            }
            this.markerCluster = {};
            this.cache.cluster = new L.FeatureGroup();
            allProps = [];
        },
        placeMarkers: function(points) {
            var me = this;
            this.i = 0;
            this.markerCluster = {};
            if (lmap.getZoom() > 17) {
                $.each(points, function(i, point) {
                    var curPnt = me.markerCluster['pnt' + point.lat + point.lng] = {
                        lat: point.lat,
                        lng: point.lng,
                        points: [point],
                        type: point.type,
                        desc: point.desc
                    }
                });
            } else {
                $.each(points, function(i, point) {
                    var curPnt = me.markerCluster['pnt' + point.block];
                    if (!curPnt) {
                        me.markerCluster['pnt' + point.block] = {
                            lat: point.lat,
                            lng: point.lng,
                            points: [point],
                            type: point.type,
                            desc: point.shortdesc
                        };
                    } else {
                        me.markerCluster['pnt' + point.block].points.push(point);
                        me.markerCluster['pnt' + point.block].desc += point.shortdesc;
                    }
                });
            }
            $.each(this.markerCluster, function(key, point) {
                var x = 'm0',
                    len = point.points.length,
                    s = 's.gif',
                    ix = 41,
                    iy = 40,
                    sx = 1,
                    sy = 1;
                me.i++;
                if (len > 10) {
                    x = 'm3';
                } else if (len > 4) {
                    x = 'm2';
                }
                if (lmap.getZoom() > 17) {
                    x = 'marker';
                    s = 'marker-shadow.png';
                    ix = 25;
                    iy = 41;
                    sx = 41;
                    sy = 41;
                }
                if (point.type == 'camera') {
                    x = 'camera';
                    ix = 150;
                    iy = 150;
                    sx = 150;
                    sy = 150;
                }
                if (!me.clusterIcons[x]) {
                    me.clusterIcons[x] = {
                        iconUrl: '/static/resources/images/' + x + '.png',
                        shadowUrl: '/static/resources/images/' + s,
                        iconSize: new L.Point(ix, iy),
                        shadowSize: new L.Point(sx, sy),
                        iconAnchor: new L.Point(20, 20)
                    };
                }
                var latlng = new L.LatLng(point.lat, point.lng),
                    mkr = new L.Marker(latlng, {
                        icon: L.icon(me.clusterIcons[x])
                    }),
                    popupContent = point.desc;
                mkr.on('click', fn.updatePano);
                mkr.bindPopup(popupContent);
                me.cache.markers.push(mkr);
                me.cache.cluster.addLayer(mkr);
            });
            lmap.addLayer(this.cache.cluster);
        },
        mapUpdateView: function() {
            var setViewOnZoom = false,
                total_cnt = 0,
                addrList = $('#results-list');

            ctr = lmap.getCenter();

            slat = ctr.lat;
            slon = ctr.lng;

            var bounds = lmap.getBounds(),
                lon1 = bounds._northEast.lng,
                lat1 = bounds._northEast.lat,
                x = (slon - lon1) * Math.cos((lat1 + slat) / 2),
                y = (slat - lat1),
                d = Math.sqrt(x * x + y * y) * R,
                r = Math.floor((d * 10) * 3);

            //fn.drawNeighborhoods(bounds);

            if (r > 3000) {
                return '';
            }

            document.location.hash = "zll/" + lmap.getZoom() + "/" + slat + "/" + slon;

            fn.showWaitMessage(strings.geowait)
            $('#loading').fadeIn('slow');
            addrList.fadeOut('slow');

            addrList.empty();
            fn.resetAllDone();
            fn.clearMarkers();

            if ($('#check1').attr('checked')) {
                fn.fetchData('qqcv-ihn5', ctr, slat, slon, r, function(i, e) {
                    var marker = new L.LatLng(e[5][0], e[5][1])
                    marker.desc = 'House: ' + e[1] + '<br/>' + e[2] + '<br/>' + e[0];
                    marker.shortdesc = 'House: ' + e[1] + '<br/>';
                    marker.block = e[0].substr(0, 4);
                    markers.push(marker);
                    allProps.push({
                        address: e[1],
                        neighborhood: e[2],
                        block: e[0],
                        type: 'house',
                        lat: e[5][0],
                        lon: e[5][1]
                    });
                });
            } else {
                fn.dataSetsLoaded['qqcv-ihn5'] = true;
            }

            if ($('#check2').attr('checked')) {
                fn.fetchData('gf6h-35ki', ctr, slat, slon, r, function(i, e) {
                    var marker = new L.LatLng(e[5][0], e[5][1])
                    marker.desc = 'Land: ' + e[0] + '<br/>' + e[1] + '<br/>' + e[2] + '<br/>' + e[4];
                    marker.shortdesc = 'Land: ' + e[1] + '<br/>';
                    marker.block = e[0].substr(0, 4);
                    markers.push(marker);
                    allProps.push({
                        address: e[1],
                        neighborhood: e[2],
                        block: e[0],
                        type: 'lot',
                        lat: e[5][0],
                        lon: e[5][1]
                    });
                });
            } else {
                fn.dataSetsLoaded['gf6h-35ki'] = true;
            }

            if ($('#check3').attr('checked')) {
                fn.fetchData('hdyb-27ak', ctr, slat, slon, r, function(i, e) {
                    var marker = new L.LatLng(e[5][0], e[5][1])
                    marker.desc = 'Camera: ' + e[0] + '<br/>' + e[1] + '<br/>' + e[2];
                    marker.shortdesc = 'Camera: ' + e[1] + '<br/>';
                    marker.block = e[0].substr(0, 4);
                    marker.type = 'camera';
                    markers.push(marker);
                    allProps.push({
                        address: e[1],
                        neighborhood: e[2],
                        block: e[0],
                        type: 'camera',
                        lat: e[5][0],
                        lon: e[5][1]
                    });
                });
            } else {
                fn.dataSetsLoaded['hdyb-27ak'] = true;
            }
        },

        projectPoint: function(x, y) {
            var point = lmap.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        },

        drawNeighborhoods: function(bounds){

          d3.json('NeighborhoodCensus.geojson', function(data) {

              var color = d3.scale.linear()
                .domain([0, 100])
                .range(["white", "red"]);

            $('#mapsvg').remove();

            var svg = d3.select(lmap.getPanes().overlayPane)
                .append('svg')
                .attr('width', window.screen.width)
                .attr('height', window.screen.height)
                .attr('id',"mapsvg");
            var g = svg.append('g').attr('class', 'leaflet-zoom-hide');
            var transform = d3.geo.transform({ 
                    point: fn.projectPoint 
                }),
                path = d3.geo.path().projection(transform),
                bounds = path.bounds(data);
            console.log(bounds);
            var topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr('width', bottomRight[0] - topLeft[0])
                .attr('height', bottomRight[1] - topLeft[1])
                .style('left', topLeft[0] + 'px')
                .style('top', topLeft[1] + 'px');

            g.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

            var feature = g.selectAll('path')
                .data(data.features)
                .enter()
                .append('path')
                .attr("fill", function(d) {
                    d.color = color((d.properties.Vacant == 0 || d.properties.Housing == 0) ? 0 : (d.properties.Vacant / d.properties.Housing * 100).toFixed());
                    return d.color;
                })
                .attr("stroke", function(d) {
                    return d3.rgb(d.color).darker(2);
                })
                .attr("stroke-width", 3)
                .attr('d', path)
                .style("fill-opacity", 0.6)
                .append("title")
                .text(function(d) { return d.properties.Name + ' (' + d.properties.Vacant + ' of ' + d.properties.Housing + ') ' + ((d.properties.Vacant == 0 || d.properties.Housing == 0) ? 0 : (d.properties.Vacant / d.properties.Housing * 100).toFixed()) + '%'; });

            feature.on('mouseover', function(d) {
                console.log(d.properties.Name);
              //updateFlyout(d.properties, type);
            });


            feature.on('click', function(d) {
                console.log(d);
              //setPathOnclick(d.properties, type);
            });

            feature.on('mouseout', function(d) {
              /*flyoutTimer = setTimeout(function() {
                $('#flyout').fadeOut(50);
              }, 50);*/
            });


          });

        },

        fetchData: function(datasetId, ctr, slat, slon, r, processMarkerFn) {
            $.ajax({
                url: '/api/data/' + datasetId + '/location_1/' + slat + '/' + slon + '/' + r,
                dataType: 'json',
                success: function(data) {
                    fn.dataSetsLoaded[datasetId] = true;
                    if (data.data && data.data.length > 0) {
                        var d = data.data;
                        if (d.length > 0) {
                            markers = [];
                            jQuery.each(d, processMarkerFn);
                            fn.placeMarkers(markers);
                            fn.cache.data[datasetId] = data;
                            fn.isAllDone();
                        }
                    } else {
                        fn.showErrorMessage(strings.geonoresults);
                    }
                },
                failure: function() {
                    fn.showErrorMessage(strings.geofailure)
                },
                error: function() {
                    fn.showErrorMessage(strings.geofailure);
                }
            });
        },

        isAllDone: function() {

            if (fn.dataSetsLoaded['qqcv-ihn5'] && fn.dataSetsLoaded['gf6h-35ki'] && fn.dataSetsLoaded['hdyb-27ak']) {
                $.each(allProps, function(i, prop) {
                    var x = (ctr.lng - parseFloat(prop.lon)) * Math.cos((parseFloat(prop.lat) + ctr.lat) / 2);
                    var y = (ctr.lat - parseFloat(prop.lat));
                    var d = Math.sqrt(x * x + y * y) * R;
                    prop.distance = d;
                });
                allProps.sort(function(a, b) {
                    return a.distance - b.distance;
                });
                fn.renderResults(0, 25);
                $('#results-list').fadeIn('slow');
                $('#result-value').html(allProps.length);
                $('#loading').fadeOut('slow');
                fn.hideWaitMessage();
                $('#initial').hide();
                if (allProps.length > 25) {
                    $('#btn-next').show();
                } else {
                    $('#btn-next').hide();
                }
            }

        },

        renderResults: function(start, end) {
            fn.curStart = start;
            fn.curEnd = end;
            var addrList = $('#results-list');
            $.each(allProps, function(i, prop) {
                if (i >= start && i <= end) {
                    addrList.append('<li class="' + prop.type + '" data-idx="' + i + '"><div class="street-view"></div><div class="listing"><span class="icon"></span><span class="address">' + fn.toTitleCase(prop.address) + '</span><span class="address">' + fn.toTitleCase(prop.neighborhood) + '</span></div></li>');
                }
            });
        },

        propertiesNextPage: function() {
            fn.renderResults(fn.curStart + 25, fn.curEnd + 25);
        },

        resetAllDone: function() {
            fn.dataSetsLoaded = {
                'qqcv-ihn5': false,
                'gf6h-35ki': false,
                'hdyb-27ak': false
            }
        },

        onListClick: function(ev) {
            $('#results-list').find('li').removeClass('active');
            $(ev.currentTarget).addClass('active');
            fn.showPropDetails(allProps[parseInt(ev.currentTarget.getAttribute('data-idx'), 10)])
        },

        showPropDetails: function(prop) {

            if (this.cache.active) {
                this.cache.active.clearLayers();
                lmap.removeLayer(this.cache.active);
            }
            this.cache.active = new L.FeatureGroup();
            var dtBox = $('#detail-box'),
                list = '',
                csa = fn.cache.data['qqcv-ihn5'].summary.bnia[prop.neighborhood.replace(/[\/ -]/g, '_')].csa;
            $.each(prop, function(key, value) {
                list += '<div class="detail-property">' + strings[key] + ':</div><div class="detail-value">' + fn.toTitleCase(value) + '</div>'
            });
            if (fn.csa_polyline) {
                lmap.removeLayer(fn.csa_polyline);
            }
            fn.csa_polyline = L.multiPolyline([fn.cache.data['qqcv-ihn5'].summary.bnia[prop.neighborhood.replace(/[\/ -]/g, '_')].coordinates], {
                color: '#00F'
            }).addTo(lmap);
            dtBox.replaceWith('<div class="detail-box" id="detail-box">' + list + '</div>');
            var latlng = new L.LatLng(prop.lat, prop.lon),
                mkr = new L.Marker(latlng, {
                    icon: L.icon(this.activeIcon)
                });
            this.cache.active.addLayer(mkr);
            lmap.addLayer(this.cache.active);
            fn.currentneighborhood = prop.neighborhood;
            fn.populateBNIAView('', fn.cache.data['qqcv-ihn5'].summary.bnia[prop.neighborhood.replace(/[\/ -]/g, '_')], prop.neighborhood);
            $('#bnia-details').show();

        },

        populateBNIAView: function(el, bniadata, neighborhood){

            var values = [],
                labels = [];
            values.push(parseInt(bniadata.female12, 10));
            labels.push("Female");
            values.push(parseInt(bniadata.male12, 10));
            labels.push("Male");
            $("#bnia-sex"+el).find('svg').remove();
            Raphael("bnia-sex"+el, 170, 160).pieChart(110, 110, 60, values, labels, "#fff");
            var values = [],
                labels = [];
            values.push(parseInt(bniadata.paa12, 10));
            labels.push("African American");
            values.push(parseInt(bniadata.pwhite12, 10));
            labels.push("Caucasian");
            values.push(parseInt(bniadata.pasi12, 10));
            labels.push("Asian");
            values.push(parseInt(bniadata.p2more12, 10));
            labels.push("Two or More Races");
            values.push(parseInt(bniadata.phisp12, 10));
            labels.push("Hispanic");
            values.push(parseInt(bniadata.ppac12, 10));
            labels.push("Other");
            $("#bnia-race"+el).find('svg').remove();
            Raphael("bnia-race"+el, 170, 160).pieChart(110, 110, 60, values, labels, "#fff");
            var values = [],
                labels = [];
            values.push(parseInt(bniadata.age512, 10));
            labels.push("0-5");
            values.push(parseInt(bniadata.age1812, 10));
            labels.push("6-18");
            values.push(parseInt(bniadata.age2412, 10));
            labels.push("19-24");
            values.push(parseInt(bniadata.age6412, 10));
            labels.push("25-64");
            values.push(parseInt(bniadata.age6512, 10));
            labels.push("65+");
            $("#bnia-age"+el).find('svg').remove();
            Raphael("bnia-age"+el, 170, 160).pieChart(110, 110, 60, values, labels, "#fff");
            $("#bnia-details"+el).find('.bnia-area-title').text(neighborhood.toUpperCase());
            $("#hhsize10"+el).text(Math.floor(bniadata.hhsize12 * 10) / 10);
            $("#mhhi10"+el).text("$" + usMoney(bniadata.mhhi12));
            $("#salepr10"+el).text("$" + bniadata.salepr12);
            $("#dom10"+el).text((bniadata.dom12));
            $("#shomes10"+el).text((bniadata.shomes12));
            $("#ownroc10"+el).text("%" + (bniadata.ownroc12));
            $("#fore10"+el).text("%" + (bniadata.fore12));
            $("#vacant10"+el).text("%" + (bniadata.vacant12));
            $("#vio10"+el).text("%" + Math.floor(bniadata.vio12 * 10) / 10);
            $("#resrehab10"+el).text("%" + Math.floor(bniadata.resrehab12   * 10) / 10);
            $("#totalres10"+el).text((bniadata.totalres12));
            $("#compl10"+el).text("%" + Math.floor(bniadata.compl12));
            $("#liquor10"+el).text("%" + Math.floor(bniadata.liquor12));
            $("#unempr10"+el).text("%" + Math.floor(bniadata.unempr12));

            if ($("#weather10"+el)){
                $("#weather10"+el).text("%" + Math.floor(bniadata.weather12));
            }
            if ($("#hfai10"+el)){
                $("#hfai10"+el).text(Math.floor(bniadata.hfai12));
            }
            if ($("#nomail10"+el)){
                $("#nomail10"+el).text("%" + Math.floor(bniadata.nomail12));
            }
            if ($("#novhcl10"+el)){
                $("#novhcl10"+el).text("%" + Math.floor(bniadata.novhcl12));
            }
            if ($("#totemp10"+el)){
                $("#totemp10"+el).text(Math.floor(bniadata.totemp12));
            }
            if ($("#farms10"+el)){
                $("#farms10"+el).text("%" + Math.floor(bniadata.farms12));
            }
            if ($("#leadviol10"+el)){
                $("#leadviol10"+el).text("%" + Math.floor(bniadata.leadtest12));
            }
            //regvote12 / voted12
            
        },

        compareAndColorize: function(){
            var els = ["hhsize10","mhhi10","salepr10","dom10","shomes10","ownroc10","fore10","vacant10","vio10","resrehab10","totalres10","compl10","liquor10","unempr10","weather10","hfai10","nomail10","novhcl10","totemp10","farms10","leadviol10"];
            for (var i = 0; i < els.length; i++){
                var val1 = parseFloat($('#'+els[i]+'_left').html().replace('$','').replace('%','')),
                    val2 = parseFloat($('#'+els[i]+'_right').html().replace('$','').replace('%',''));
                console.log(val1 + ' | ' + val2);
                if (val1 > val2){
                    $('#'+els[i]+'_left').addClass('green');
                } else if (val1 < val2){
                    $('#'+els[i]+'_right').addClass('green');
                } else {
                    $('#'+els[i]+'_left').addClass('blue');
                    $('#'+els[i]+'_right').addClass('blue');
                }
            }
        },

        updatePano: function(e) {
            /*if (e){
            var loc = new google.maps.LatLng(e.target._latlng.lat,e.target._latlng.lng);
        }else{
            var loc = new google.maps.LatLng(strings.bmoreCtrLat, strings.bmoreCtrLng);
        }
        if (panorama){
            panorama.setPosition(loc);
        }else{
            panorama = new  google.maps.StreetViewPanorama(document.getElementById("panoramacontainer"),{
              position: loc,
              pov: {
                heading: 34,
                pitch: 10,
                zoom: 1
              }
            });
        }*/
        }
    }, lmap, tileLayer, slat = strings.bmoreCtrLat,
    slon = strings.bmoreCtrLng,
    panorama, curZoom = 12;

$(document).ready(function() {

    $("#address").autocomplete({
      source: function( request, response ) {
        if ( this.xhr ) {
            this.xhr.abort();
        }
        this.xhr = $.ajax({
            url: "/api/autocomplete/"+request.term,
            dataType: "json",
            success: function( data ) {
                var i = 0, resp = [];
                for (;i < data.data.length; i++){
                    resp.push({
                        label: data.data[i].address,
                        value: data.data[i].full_address
                    });
                }
                response( resp );
            },
            error: function() {
                response([]);
            }
        });
      },
      minLength: 3,
      select: function( event, ui ) {
        var address = ui.item ? ui.item.value : '',
            geocoder = new google.maps.Geocoder();
        geocoder.geocode({
                address: address
            },
            function(result) {
                var dialog, len, point;
                if (result.length > 1) {
                    alert("Multiple matches were found.  Please provide a more specific address. ie: '3600 Roland Ave'");
                } else {
                    ctr = new L.LatLng(result[0].geometry.location.lat(), result[0].geometry.location.lng());
                    lmap.setView(ctr, 17);
                }
            }
        );
      }
    });
	
	$("#comparesearch").autocomplete({
      source: function( request, response ) {
        if ( this.xhr ) {
            this.xhr.abort();
        }
        this.xhr = $.ajax({
            url: "/api/autocomplete/"+request.term,
            dataType: "json",
            success: function( data ) {
                var i = 0, resp = [];
                for (;i < data.data.length; i++){
                    resp.push({
                        label: data.data[i].address,
                        value: data.data[i].full_address
                    });
                }
                response( resp );
            },
            error: function() {
                response([]);
            }
        });
      },
      minLength: 3,
      select: function( event, ui ) {
        var address = ui.item ? ui.item.value : '',
            geocoder = new google.maps.Geocoder();
        geocoder.geocode({
                address: address
            },
            function(result) {
                var dialog, len, point;
                if (result.length > 1) {
                    alert("Multiple matches were found.  Please provide a more specific address. ie: '3600 Roland Ave'");
                } else {
				
                    $.ajax({
                        url: '/api/bnia/' + result[0].address_components[2].long_name,
                        dataType: 'json',
                        success: function(data) {
                            
                            if (data.data && data.data.length > 0) {
                                var d = data.data;
                                $("#bniacompare").fancybox().trigger('click');
                                fn.populateBNIAView('_left', fn.cache.data['qqcv-ihn5'].summary.bnia[fn.currentneighborhood.replace(/[\/ -]/g, '_')], fn.currentneighborhood);
                                fn.populateBNIAView('_right', d[0], result[0].address_components[2].long_name);
                                fn.compareAndColorize();
                            } else {
                                fn.showErrorMessage(strings.geonoresults);
                            }
                        },
                        failure: function() {
                            fn.showErrorMessage(strings.geofailure)
                        },
                        error: function() {
                            fn.showErrorMessage(strings.geofailure);
                        }
                    });
        
				}
                    
				
            }
        );
      }
    });

    $('#bnia-details').hide();

    $(window).resize(fn.resizePage);

    $(".options").buttonset().click(function() {
        fn.mapUpdateView();
    });
    $('#btn-next').button();
    $('#btn-next').click(function() {
        fn.propertiesNextPage();
    });

    $("#credits").fancybox({
        'autoDimensions': true
    });

    $("#bniacompare").fancybox({
        'autoDimensions': true
    });

    $("#search-box").click(function() {
        $("#search-box").toggleClass("active-search");
    });

    $('#result-list').hide();
    $('#loading').hide();
    $('#btn-next').hide();

    $('#results-list').delegate('li', 'click', fn.onListClick);

    if (document.location.hash !== '') {
        var hashParts = document.location.hash.replace('#', '').split('/');
        if (hashParts[0] == 'zll') {
            curZoom = hashParts[1];
            slat = hashParts[2];
            slon = hashParts[3];
        }
    }

    tileLayer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    });
    lmap = new L.Map('lmapcontainer', {
        layers: [tileLayer],
        zoom: curZoom,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
        center: new L.LatLng(slat, slon)
    });
    lmap.addLayer(tileLayer);

    lmap.on('zoomend', fn.mapUpdateView);
    lmap.on('viewreset', fn.mapUpdateView)
    lmap.on('moveend', fn.mapUpdateView);

    //fn.drawNeighborhoods();

    $('#btn-submit').click(function() {
        var address = $('#address').val() + ",Baltimore,MD,USA",
            geocoder = new google.maps.Geocoder();
        geocoder.geocode({
                address: address
            },
            function(result) {
                var dialog, len, point;
                if (result.length > 1) {
                    alert("Multiple matches were found.  Please provide a more specific address. ie: '3600 Roland Ave'");
                } else {
                    ctr = new L.LatLng(result[0].geometry.location.lat(), result[0].geometry.location.lng());
                    lmap.setView(ctr, 17);
                }
            }
        );
    });

    fn.resizePage();

    function initialinfo() {
        if (STARTLOC !== '') {
            $('#address').val(STARTLOC);
            $('#btn-submit').click();
        }
    }

    setTimeout(initialinfo, 2000);

});