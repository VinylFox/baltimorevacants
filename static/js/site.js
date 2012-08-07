var allProps = [], strings = {
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
    hideWaitMessage: function(){
        $('#lmapcontainer').css({opacity:1.0});
        $('#search-msg').html('');
    },
    showErrorMessage: function(msg){
        $('#search-msg').html(msg);
        $('#lmapcontainer').css({opacity:1});
        $('#search-msg-wrap').addClass('invalid-wrap');
    },
    resizePage: function(){
        $('.map-contain').css({
            'width' : (($(window).width()) - 260) + 'px',
            'height' : (($(window).height())) + 'px'
        });
        $('#lmapcontainer').css({
            'width' : (($(window).width()) - 260) + 'px',
            'height' : (($(window).height())) + 'px'
        });
        lmap.invalidateSize();
        $('#sb-contents').css({
            'height' : (($(window).height())) + 'px'
        });
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
        this.cache.cluster = new L.FeatureGroup();
        this.markerCluster = {};
        if (lmap.getZoom() > 17){
            $.each(points, function(i, point) {
                var curPnt = me.markerCluster['pnt' + point.lat + point.lng] = {
                    lat : point.lat,
                    lng : point.lng,
                    points : [point],
                    desc : point.desc
                }
            });
        }else{
            $.each(points, function(i, point) {
                var curPnt = me.markerCluster['pnt' + point.block];
                if(!curPnt) {
                    me.markerCluster['pnt' + point.block] = {
                        lat : point.lat,
                        lng : point.lng,
                        points : [point],
                        desc : point.shortdesc
                    };
                } else {
                    me.markerCluster['pnt'+point.block].points.push(point);
                    me.markerCluster['pnt'+point.block].desc += point.shortdesc;
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
            if(len > 10) {
                x = 'm3';
            } else if(len > 4) {
                x = 'm2';
            }
            if (lmap.getZoom() > 17){
                x = 'marker';
                s = 'marker-shadow.png';
                ix = 25;
                iy = 41;
                sx = 41;
                sy = 41;
            }
            if(!me.clusterIcons[x]) {
                me.clusterIcons[x] = L.Icon.extend({
                    iconUrl : 'static/resources/images/' + x + '.png',
                    shadowUrl : 'static/resources/images/'+s,
                    iconSize : new L.Point(ix, iy),
                    shadowSize : new L.Point(sx, sy),
                    iconAnchor : new L.Point(20, 20)
                });
            }
            var latlng = new L.LatLng(point.lat, point.lng),
                mkr = new L.Marker(latlng, {
                    icon : new me.clusterIcons[x]()
                }),
                popupContent = point.desc;
            mkr.on('click',fn.updatePano);
            mkr.bindPopup(popupContent);
            me.cache.markers.push(mkr);
            me.cache.cluster.addLayer(mkr);
        });
        lmap.addLayer(this.cache.cluster);
    },
    mapUpdateView: function(){
        //console.log('mapUpdateView');
        var setViewOnZoom = false, 
            R = 6371,
            ctr, 
            total_cnt = 0;

        ctr = lmap.getCenter();
        
        slat = ctr.lat;
        slon = ctr.lng;
        
        var bounds = lmap.getBounds(),
            lon1 = bounds._northEast.lng,
            lat1 = bounds._northEast.lat,
            x = (slon-lon1) * Math.cos((lat1+slat)/2),
            y = (slat-lat1),
            d = Math.sqrt(x*x + y*y) * R,
            r = Math.floor((d*10)*3);
        
        if (r > 2000){
            return '';
        }
        
        fn.showWaitMessage(strings.geowait)
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
                        jQuery.each(d, function(i,e){
                            var marker = new L.LatLng(e[13][1],e[13][2])
                            marker.desc = 'House: '+e[12]+'<br/>'+e[10]+'<br/>'+e[9]+'<br/>'+e[8];
                            marker.shortdesc = 'House: '+e[9]+'<br/>';
                            marker.block = e[8].substr(0,4);
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
                        fn.placeMarkers(vacantMarkers, true);
                    }
                    $.ajax({
                        url: '/data/gf6h-35ki/location_1/'+slat+'/'+slon+'/'+r,
                        dataType: 'json',
                        success: function(data2) {
                            if (data2.data && data2.data.length > 0){
                                var d = data2.data;
                                if (d.length > 0){
                                    vacantMarkers = [];
                                    jQuery.each(d, function(i,e){
                                        var marker = new L.LatLng(e[13][1],e[13][2])
                                        marker.desc = 'Land: '+e[12]+'<br/>'+e[10]+'<br/>'+e[9]+'<br/>'+e[8];
                                        marker.shortdesc = 'Land: '+e[9]+'<br/>';
                                        marker.block = e[8].substr(0,4);
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
                                    fn.placeMarkers(vacantMarkers, false);
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
                                return a.distance - b.distance;
                            });
                            $.each(allProps,function(i, prop){
                                if (i < 26){
                                    addrList.append('<li class="'+prop.type+'"><div class="street-view"></div><div class="listing"><span class="icon"></span><span class="address">'+prop.address+'</span><span class="address">'+prop.neighborhood+'</span><span class="block">'+prop.block+' ('+Math.round(prop.distance)+'m)</span></div></li>');
                                }
                            });
                            $('#results-list').fadeIn('slow');
                            $('#result-value').html(data.data.length+data2.data.length);
                            $('#loading').fadeOut('slow');
                            fn.hideWaitMessage();
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
    
    $(window).resize(fn.resizePage);

    $( ".options" ).buttonset().click(function(){
        console.log(arguments);
    });
    $( "a", ".text-btn" ).button();
    $( "a", ".text-btn" ).click(function() { return false; });

    $("a#credits").fancybox({
        'autoDimensions' : true
    });
    
    $( "#search-box" ).click(function() {
        $( "#search-box" ).toggleClass( "active-search");
    });
    
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
        var address = $('#address').val() + ",Baltimore,MD,USA",
            geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {address: address},
          function(result) {
              var dialog, len, point;
              if (result.length > 1) {
                  alert("Multiple matches were found.  Please provide a more specific address. ie: '3600 Roland Ave'");
              } else {
                  ctr = new L.LatLng(result[0].geometry.location.lat(), result[0].geometry.location.lng());
                  lmap.setView(ctr,17);
              }
          }
        );
    });
    
    fn.resizePage();
    
});