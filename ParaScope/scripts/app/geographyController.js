define(["app/utilities","app/traceController"],
function (utilities,traceController) {
    //these are all mapping helper functions that need to go somewhere else
    var getWebPointFromLatLong = function (latitude, longitude) {
        var geographicPoint = new esri.geometry.Point(longitude, latitude);
        var mercatorPoint = esri.geometry.geographicToWebMercator(geographicPoint);
        return mercatorPoint;
    };
    var createPointGraphic = function (latitude, longitude, image, width, height) {
        return new esri.Graphic(getWebPointFromLatLong(latitude, longitude), new esri.symbol.PictureMarkerSymbol(image, width, height));
    };
    var segmentGraphic;
    var zoomToSegment = function (index,directionFeatures) {
        var segment = directionFeatures[index];
        var segmentSymbol = new esri.symbol.SimpleLineSymbol().setColor(new dojo.Color([255, 0, 0, 0.5])).setWidth(15);

        map.setExtent(segment.geometry.getExtent(), true);
        if (!segmentGraphic) {
            segmentGraphic = map.graphics.add(new esri.Graphic(segment.geometry, segmentSymbol));
        } else {
            segmentGraphic.setGeometry(segment.geometry);
        }
    };  

    var routeCallback = function(solveResult){
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
        
        
    };
    var vehicleLocationGraphic = null;
    var me = {
        init: function(){
            
            map = new esri.Map("map", {
              basemap: "streets",
              center: [-98.5795,39.8282],
              zoom: 4,
              //slider: false,
              autoResize: false
            });
            
            
            dojo.connect(map, "onLoad", function(){
                //do nothing, may want to do some geolocation type things in here
            });
                
                
        },
        viewModel:kendo.observable({
            currentDestination:null,
            followVehicle:true,
            directionsList: [],
            directionsFeatures: [],
            setNextManeuver: function(reset){
                var maneuverIterator = me.viewModel.get("maneuverIterator");
                if(reset){
                    maneuverIterator = 1;
                }
                //me.viewModel.get("maneuverIterator");
                //me.viewModel.set("nextManeuver",);
                //me.viewModel.set("nextManeuverCoordinate",);
            },
            resetOdometer: function(){
                me.viewModel.set("gpsInfo.odometer", 0);
            },
            zoomToSegment: function (e) {
                zoomToSegment(e.data.index, me.viewModel.get("directionsFeatures"));
            },
            refreshDirections: function () {
                me.mapRoute();
            },
            back: function () {
                me.viewModel.deactivateMaps();
                kendoApp.navigate("#routeView");
            },
            gpsInfo: {speed:0},
            show: function(e){
                //$("body").append("test");
              dojo.byId("map").style.width = dojo.byId("mapView").style.width;
              dojo.byId("map").style.height = (window.innerHeight) + "px";
                map.resize();
            
                //may be able to use this for navigation
                //$("#map").rotate(50);
            },
            mapsActive: false,
            activateMaps: function(){
                me.viewModel.set("mapsActive",true);
            },
            deactivateMaps: function(){
                me.viewModel.set("mapsActive",false);                
            }
        }),
        clearGeolocationWatch: function(){
            traceController.logEvent("Clearing geolocation watch.");
            if(me.geolocationWatch){
                navigator.geolocation.clearWatch(me.geolocationWatch);
                me.geolocationWatch = null;
            }
        },
        startGeolocationWatch: function(){
            traceController.logEvent("Starting geolocation watch.");
            me.geolocationWatch = navigator.geolocation.watchPosition(function(position) {
                
    		    var lastGpsInfo = me.getGpsInfo(); 
                if(me.viewModel.get("mapsActive")){
                   if(vehicleLocationGraphic != null){
                    map.graphics.remove(vehicleLocationGraphic);
                    
                    }else{
                        //vehicleLocationGraphic.setGeometry(getWebPointFromLatLong(position.coords.latitude, position.coords.longitude));  
                        //if(me.viewModel.get("followVehicle")){
                        //    map.centerAndZoom(getWebPointFromLatLong(position.coords.latitude,position.coords.longitude), 15);                                
                        //}              
                    }
                    vehicleLocationGraphic = createPointGraphic(position.coords.latitude,position.coords.longitude,'images/icon_map-vehicleOnTime.png', 30, 40);
                    map.graphics.add(vehicleLocationGraphic);
                    if(me.viewModel.get("followVehicle")){
                        map.centerAndZoom(getWebPointFromLatLong(position.coords.latitude,position.coords.longitude), 17);
                        
                    } 
                }
                
                if (position.coords.accuracy > 50) {
                    traceController.logEvent("GPS watch retruned with an accuracy greater than 50 meters.", position);
                    return;
                }                
                
                if (lastGpsInfo.latitude == null) {
                    //we've never stored gps info so this is the first
                    lastGpsInfo.latitude = position.coords.latitude;
                    lastGpsInfo.longitude = position.coords.longitude;
                    lastGpsInfo.accuracy = position.coords.accuracy;
                    lastGpsInfo.speed = position.coords.speed * 2.23694;
                    lastGpsInfo.timeTaken = utilities.getCurrentUTC();
                    traceController.logEvent("Setting initial GPS postion.", lastGpsInfo);
                    
                    me.setGpsInfo(lastGpsInfo);
                    return;
                }
                
                var distanceMoved = utilities.calculateDistance(lastGpsInfo.latitude, lastGpsInfo.longitude, position.coords.latitude, position.coords.longitude);
                
                if (distanceMoved > .03) {
                    
                    traceController.logEvent("Odometer is being incremented. Last odometer: " + lastGpsInfo.odometer + 
                                                ", Distance Moved: " + distanceMoved + 
                                                ", New Odometer: " + (parseFloat(lastGpsInfo.odometer) + distanceMoved));
                    
                    //we've move more than gps drift so calculate how far we've traveled
                    lastGpsInfo.odometer = parseFloat(lastGpsInfo.odometer) + distanceMoved;
                    lastGpsInfo.latitude = position.coords.latitude;
                    lastGpsInfo.longitude = position.coords.longitude;
                }
                
                lastGpsInfo.accuracy = position.coords.accuracy;
                lastGpsInfo.speed = position.coords.speed * 2.23694;
                lastGpsInfo.timeTaken = utilities.getCurrentUTC();
                traceController.logEvent("Setting GPS postion.", lastGpsInfo);
                me.setGpsInfo(lastGpsInfo);
            
            
            }, function(error) {
                //navigator.geolocation.getCurrentPosition(function(position) {
                //    traceController.logEvent("Force that shit.",position);
                //},function(error) {
                //    traceController.logEvent("Can't even force it.",error);
                //});
                traceController.logEvent("There was an error obtaining geolocation information.",error);
            }, {maximumAge: 3000, timeout: 50000,enableHighAccuracy: true});
        },
        geolocationWatch: null,       
        getGpsInfo: function(){
            return me.viewModel.get("gpsInfo");        
        },
        setGpsInfo: function(gpsInfo){
            me.viewModel.set("gpsInfo", {});
            me.viewModel.set("gpsInfo", gpsInfo);
            comm.addGPSReport(gpsInfo);
        },
        setGpsTime: function(gpsTime){
            me.viewModel.set("gpsInfo.timeTaken", gpsTime);
        },
        setOdometer: function(odometer){
            me.viewModel.set("gpsInfo.odometer", odometer);
        },
        getOdometer: function(){
            return me.viewModel.get("gpsInfo.odometer");
        },
        mapRoute: function () {
            var destination = me.getDestination();
            map.graphics.clear();
            var routeTask = new esri.tasks.RouteTask("http://usloft1491.serverloft.com:6080/arcgis/rest/services/Route/NAServer/Route");
            //we only set gpsinfo when we know it is accurate so this just grabs last known accurate location.
            var lastGpsInfo = me.getGpsInfo();
            //setup the route parameters
            routeParams = new esri.tasks.RouteParameters();
            routeParams.stops = new esri.tasks.FeatureSet();
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = esri.Units.MILES;
    
            var startGraphic = createPointGraphic(lastGpsInfo.latitude,lastGpsInfo.longitude,'images/icon_map-start.png', 30, 40);
            routeParams.stops.features.push(startGraphic);
            var endGraphic = createPointGraphic(destination.latitude,destination.longitude,'images/icon_map-stop.png', 30, 40);
            routeParams.stops.features.push(endGraphic);
            map.graphics.add(startGraphic);
            map.graphics.add(endGraphic);
        
            
            routeTask.solve(routeParams, routeCallback, function(error){
                if(error){
                    
                }
            });
           
        },
        setDestination: function(coordinate){
           me.viewModel.set("currentDestination",coordinate);
           me.mapRoute();            
        },
        getDestination: function(){
           return me.viewModel.get("currentDestination");
        }
    };    
    
    
    return me;
});
