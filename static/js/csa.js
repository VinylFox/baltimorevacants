$(document).ready(function() {

    $('#lmapcontainer').css({
        'width': (($(window).width())) + 'px',
        'height': (($(window).height())) + 'px'
    });

    tileLayer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    });
    lmap = new L.Map('lmapcontainer', {
        layers: [tileLayer],
        zoom: 12,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
        center: new L.LatLng(39.290555, -76.609604)
    });
    lmap.addLayer(tileLayer);

    $.ajax({
        url: '/api/csa',
        dataType: 'json',
        success: function(data) {
            if (data.data && data.data.length > 0) {
                var d = data.data;
                if (d.length > 0) {
                    jQuery.each(d, function(idx, itm){
                        L.multiPolyline([itm.coordinates], {
                            color: '#000'
                        }).addTo(lmap);
                    });
                }
            }
        }
    });

});