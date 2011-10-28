var strings = {
    geowait: "Let me find out whats happeing, mmm kay...",
    geofailure: "Something went really wrong. Hide your kids, hide your wife.",
    geonoresults: "Did not find anything in that area",
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
                    points : [point]
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
            var mkr = new L.Marker(new L.LatLng(point.lat, point.lng), {
                icon : new me.clusterIcons[x]()
            });
            me.cache.markers.push(mkr);
            me.cache.cluster.addLayer(mkr);
        });
        lmap.addLayer(this.cache.cluster);
    },
    mapUpdateView: function(e){
        fn.showWaitMessage(strings.geowait)
        var ctr = lmap.getCenter();
        var bounds = lmap.getBounds();
        
        slat = ctr.lat;
        slon = ctr.lng;
        
        var lon1 = bounds._northEast.lng;
        var lat1 = bounds._northEast.lat
        
        var R = 6371; // km
        
        var x = (slon-lon1) * Math.cos((lat1+slat)/2);
        var y = (slat-lat1);
        var d = Math.sqrt(x*x + y*y) * R;
        
        $.ajax({
            url: '/data/'+slat+'/'+slon+'/'+Math.floor((d*10)*3),
            dataType: 'json',
            success: function(data) {
                if (data.data && data.data.length > 0){
                    var d = data.data;
                    if (d.length > 0){
                        fn.vacantMarkers = [];
                        jQuery.each(d, function(i,e){
                            var marker = new L.LatLng(e[20][1],e[20][2])
                            fn.vacantMarkers.push(marker);
                        });
                        fn.placeMarkers(fn.vacantMarkers, true);
                    }
                    fn.showMessage('Found '+data.data.length+' results.');
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
        
    }
}, lmap, tileLayer, slat, slon;

$(document).ready(function(){
    
    tileLayer = new L.TileLayer('http://{s}.tile.cloudmade.com/'+strings.cmkey+'/997/256/{z}/{x}/{y}.png', {
        maxZoom : 18
    });
    lmap = new L.Map('lmapcontainer',{
        layers : [tileLayer],
        zoom : 17,
        maxZoom : 18,
        zoomControl : true,
        attributionControl : false,
        center : new L.LatLng(strings.bmoreCtrLat, strings.bmoreCtrLng)
    });
    lmap.addLayer(tileLayer);
    fn.mapUpdateView();
        
    lmap.on('moveend', fn.mapUpdateView);
});