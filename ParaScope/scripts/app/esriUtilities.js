define(["app/utilities"],
function (utilities) {
    var segmentGraphic;
    var vehicleLocationGraphic = null;
    
    var me = {
        init: function(){
        },
       getWebPointFromLatLong: function (latitude, longitude) {
            var geographicPoint = new esri.geometry.Point(longitude, latitude);
            var mercatorPoint = esri.geometry.geographicToWebMercator(geographicPoint);
            return mercatorPoint;
        },
        createPointGraphic: function (latitude, longitude, image, width, height) {
            return new esri.Graphic(getWebPointFromLatLong(latitude, longitude), new esri.symbol.PictureMarkerSymbol(image, width, height));
        },
        zoomToSegment: function (index,directionFeatures) {
            var segment = directionFeatures[index];
            var segmentSymbol = new esri.symbol.SimpleLineSymbol().setColor(new dojo.Color([255, 0, 0, 0.5])).setWidth(15);
    
            map.setExtent(segment.geometry.getExtent(), true);
            if (!segmentGraphic) {
                segmentGraphic = map.graphics.add(new esri.Graphic(segment.geometry, segmentSymbol));
            } else {
                segmentGraphic.setGeometry(segment.geometry);
            }
        },
        routeCallback: function(solveResult){
             var data = [];
            //console.log(JSON.stringify(solveResult));
            var directions = solveResult.routeResults[0].directions;
            me.viewModel.set("directionsFeatures", directions.features);
            var routeSymbol = new esri.symbol.SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(4);
    
            //Add route to the map.
            var routeGraphic = new esri.Graphic(directions.mergedGeometry, routeSymbol);
            map.graphics.add(routeGraphic);
            //routeGraphic.getDojoShape().moveToBack();
            //cts.geography.zoomToExtent(directions.extent);
    
    
            //Display the directions.
            var directionsInfo = solveResult.routeResults[0].directions.features;
            data = $.map(directionsInfo, function (feature, index) {
                var driveTime = Math.floor(feature.attributes.time).toString() + " min " + utilities.toFixed((feature.attributes.time - Math.floor(feature.attributes.time)) * 60, 0).toString() + " sec";
                var distance;
                if (feature.attributes.length < .25) {
                    distance = utilities.toFixed(feature.attributes.length * 5280,0).toString() + " ft";
                } else {
                    distance = utilities.toFixed(feature.attributes.length, 1).toString() + " mi";
                }
                return {
                    "detail": feature.attributes.text,
                    "distance": distance,
                    "driveTime": driveTime,
                    "index": index
                };
            });
            me.viewModel.set("directionsList", data);
            
            
        }
    };    
    
    return me;
});
