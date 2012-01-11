var strings = {
    geowait: "Loading properties...",
    geofailure: "Failed to load data.",
    geonoresults: "No properties to map in this area",
    bmoreCtrLat: 39.290555,
    bmoreCtrLng: -76.609604,
    cmkey: '15e536b2a81349ea8e08f9a90800dd71'
}, fn = {
    cache: {
        markers : [],
        layers : [],
        clusters : []
    },
    clusterIcons : [],
    showMessage: function(msg){
        $('#search-msg-wrap').removeClass('invalid-wrap');
        $('#search-msg').html(msg);
        $('#lmapcontainer').css({opacity:1});
    },
    showWaitMessage: function(msg){
        $('#search-msg-wrap').removeClass('invalid-wrap');
        $('#lmapcontainer').css({opacity:0.3});
        $('#search-msg').html(msg);
    },
    showErrorMessage: function(msg){
        $('#search-msg').html(msg);
        $('#lmapcontainer').css({opacity:1});
        $('#search-msg-wrap').addClass('invalid-wrap');
    },
    placeMarkers: function(points, clearPrevious){
        var me = this;
        this.i = 0;
        if(clearPrevious === true && this.cache.cluster) {
            this.cache.cluster.clearLayers();
            lmap.removeLayer(this.cache.cluster);
            $.each(this.cache.markers, function(i,mkr){
                lmap.removeLayer(mkr);
            });
        }
        this.cache.cluster = new L.LayerGroup();
        this.markerCluster = {};
        $.each(points, function(i, point) {
            var curPnt = me.markerCluster['pnt' + point.lat + point.lng];
            if(!curPnt) {
                me.markerCluster['pnt' + point.lat + point.lng] = {
                    lat : point.lat,
                    lng : point.lng,
                    points : [point],
                    desc : point.desc
                };
            } else {
                me.markerCluster['pnt'+point.lat+point.lng].points.push(point);
            }
        });
        $.each(this.markerCluster, function(key, point) {
            var x = 0, len = point.points.length;
            me.i++;
            if(len > 10) {
                x++;
            } else if(len > 50) {
                x = 2;
            } else if(len > 100) {
                x = 3;
            } else if(len > 150) {
                x = 4;
            } else if(len > 250) {
                x = 5;
            }
            if(!me.clusterIcons[x]) {
                me.clusterIcons[x] = L.Icon.extend({
                    iconUrl : 'static/images/m' + x + '.png',
                    shadowUrl : 'static/images/s.gif',
                    iconSize : new L.Point(41, 40),
                    shadowSize : new L.Point(1, 1),
                    iconAnchor : new L.Point(20, 20)
                });
            }
            var latlng = new L.LatLng(point.lat, point.lng);
            var mkr = new L.Marker(latlng, {
                icon : new me.clusterIcons[x]()
            });
            var popupContent = point.desc;
            mkr.on('click',fn.updatePano);
            mkr.bindPopup(popupContent);
            me.cache.markers.push(mkr);
            me.cache.cluster.addLayer(mkr);
        });
        lmap.addLayer(this.cache.cluster);
    },
    mapUpdateView: function(e){
        if ((strings.bmoreCtrLat == e.lat && strings.bmoreCtrLng == e.lng) || !e.lat){
            return '';
        }
        fn.showWaitMessage(strings.geowait)
        var ctr, total_cnt = 0;
        if (e && e.lat){
            ctr = new L.LatLng(e.lat, e.lng);
            lmap.panTo(ctr);
        }else{
            ctr = lmap.getCenter();
        }
        var bounds = lmap.getBounds();
        
        slat = ctr.lat;
        slon = ctr.lng;
        
        var lon1 = bounds._northEast.lng;
        var lat1 = bounds._northEast.lat
        
        var R = 6371; // km
        
        var x = (slon-lon1) * Math.cos((lat1+slat)/2);
        var y = (slat-lat1);
        var d = Math.sqrt(x*x + y*y) * R;
        var allProps = [], r = Math.floor((d*10)*3);
        
        $('#loading').fadeIn('slow');
        $('#results-list').fadeOut('slow');
        
        $.ajax({
            url: '/data/qqcv-ihn5/location_1/'+slat+'/'+slon+'/'+r,
            dataType: 'json',
            success: function(data) {
                if (data.data && data.data.length > 0){
                    var d = data.data;
                    if (d.length > 0){
                        vacantMarkers = [];
                        var icon = L.Icon.extend({
                            iconUrl : 'static/resources/images/marker-house.png',
                            shadowUrl : 'static/resources/images/marker-shadow.png',
                            iconSize : new L.Point(25, 41),
                            shadowSize : new L.Point(41, 41),
                            iconAnchor : new L.Point(20, 20)
                        });
                        jQuery.each(d, function(i,e){
                            var marker = new L.LatLng(e[13][1],e[13][2])
                            marker.desc = 'Property: '+e[12]+'<br/>'+e[10]+'<br/>'+e[9]+'<br/>'+e[8];
                            vacantMarkers.push(marker);
                            allProps.push({
                                address : e[9],
                                neighborhood : e[10],
                                block : e[8],
                                type: 'house',
                                lat: e[13][1],
                                lon: e[13][2]
                            });
                        });
                        fn.placeMarkers(vacantMarkers, true, icon, 'house');
                    }
                    $.ajax({
                        url: '/data/gf6h-35ki/location_1/'+slat+'/'+slon+'/'+r,
                        dataType: 'json',
                        success: function(data2) {
                            if (data2.data && data2.data.length > 0){
                                var d = data2.data;
                                if (d.length > 0){
                                    vacantMarkers = [];
                                    var icon = L.Icon.extend({
                                        iconUrl : 'static/resources/images/marker-lot.png',
                                        shadowUrl : 'static/resources/images/marker-shadow.png',
                                        iconSize : new L.Point(25, 41),
                                        shadowSize : new L.Point(41, 41),
                                        iconAnchor : new L.Point(20, 20)
                                    });
                                    jQuery.each(d, function(i,e){
                                        var marker = new L.LatLng(e[13][1],e[13][2])
                                        marker.desc = 'Lot: '+e[12]+'<br/>'+e[10]+'<br/>'+e[9]+'<br/>'+e[8];
                                        vacantMarkers.push(marker);
                                        allProps.push({
                                            address : e[9],
                                            neighborhood : e[10],
                                            block : e[8],
                                            type: 'lot',
                                            lat: e[13][1],
                                            lon: e[13][2]
                                        });
                                    });
                                    fn.placeMarkers(vacantMarkers, false, icon, 'lot');
                                }
                            }
                            var addrList = $('#results-list');
                            addrList.empty();
                            $.each(allProps,function(i, prop){
                                var x = (ctr.lng-parseFloat(prop.lon)) * Math.cos((parseFloat(prop.lat)+ctr.lat)/2);
                                var y = (ctr.lat-parseFloat(prop.lat));
                                var d = Math.sqrt(x*x + y*y) * R;
                                prop.distance = d;
                            });
                            allProps.sort(function(a,b){
                                return b.distance - a.distance;
                            });
                            $.each(allProps,function(i, prop){
                                addrList.append('<li class="'+prop.type+'"><div class="street-view"></div><div class="listing"><span class="icon"></span><span class="address">'+prop.address+'</span><span class="address">'+prop.neighborhood+'</span><span class="block">'+prop.block+'-'+prop.distance+'</span></div></li>');
                            });
                            $('#results-list').fadeIn('slow');
                            $('#result-value').html(data.data.length+data2.data.length);
                            $('#loading').fadeOut('slow');
                        },
                        failure: function(){
                            fn.showErrorMessage(strings.geofailure)
                        },
                        error: function(){
                            fn.showErrorMessage(strings.geofailure);
                        }
                    });
                }else{
                    fn.showErrorMessage(strings.geonoresults);
                }
            },
            failure: function(){
                fn.showErrorMessage(strings.geofailure)
            },
            error: function(){
                fn.showErrorMessage(strings.geofailure);
            }
        });
        
    },
    updatePano: function(e){
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
}, lmap, tileLayer, slat, slon, panorama;

$(document).ready(function(){
    $('#result-list').hide();
    $('#loading').hide();
    tileLayer = new L.TileLayer('http://{s}.tile.cloudmade.com/'+strings.cmkey+'/997/256/{z}/{x}/{y}.png', {
        maxZoom : 18
    });
    lmap = new L.Map('lmapcontainer',{
        layers : [tileLayer],
        zoom : 12,
        maxZoom : 18,
        zoomControl : true,
        attributionControl : false,
        center : new L.LatLng(strings.bmoreCtrLat, strings.bmoreCtrLng)
    });
    lmap.addLayer(tileLayer);
    
    lmap.on('moveend', fn.mapUpdateView);
    
    $('#btn-submit').click(function(){
        var address = $('#address').val() + ",Baltimore,MD,USA";
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {address: address},
          function(result) {
              var dialog, len, point;
              if (result.length > 1) {
                alert("Multiple matches were found.  Please provide a more specific address. ie: '3600 Roland Ave'");
              } else {
                fn.mapUpdateView({
                  lat: result[0].geometry.location.lat(),
                  lng: result[0].geometry.location.lng()
                });
              }
          }
        );
    });
    
});