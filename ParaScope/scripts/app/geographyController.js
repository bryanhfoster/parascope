define(["app/utilities",
		"app/traceController",

        "esri/map",
        "esri/tasks/RouteTask",
        "esri/tasks/locator",

        "esri/symbols/PictureMarkerSymbol",
        "esri/geometry/Point",
        "esri/geometry/webMercatorUtils",

        "esri/graphic",
        "esri/symbols/SimpleLineSymbol",
        "esri/tasks/RouteParameters",

        "esri/tasks/FeatureSet",
        "esri/units"],
function (utilities, traceController, 
            Map,RouteTask,Locator,
            PictureMarkerSymbol,Point, WebMercatorUtils,
            Graphic, SimpleLineSymbol, RouteParameters,
            FeatureSet, Units) {
    //these are all mapping helper functions that need to go somewhere else
    var getWebPointFromLatLong = function (latitude, longitude) {
        var geographicPoint = new Point(longitude, latitude);
        var mercatorPoint = WebMercatorUtils.geographicToWebMercator(geographicPoint);
        return mercatorPoint;
    };
    var createPointGraphic = function (latitude, longitude, image, width, height) {
        return new Graphic(getWebPointFromLatLong(latitude, longitude), new PictureMarkerSymbol(image, width, height));
    };
    var segmentGraphic;
    var zoomToSegment = function (index,directionFeatures) {
        var segment = directionFeatures[index];
        var segmentSymbol = new SimpleLineSymbol().setColor(new dojo.Color([255, 0, 0, 0.5])).setWidth(15);

        map.setExtent(segment.geometry.getExtent(), true);
        if (!segmentGraphic) {
            segmentGraphic = map.graphics.add(new Graphic(segment.geometry, segmentSymbol));
        } else {
            segmentGraphic.setGeometry(segment.geometry);
        }
    };  

    var routeCallback = function(solveResult){
         var data = [];
        //console.log(JSON.stringify(solveResult));
        var directions = solveResult.routeResults[0].directions;
        //directions.shift();
        var routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(4);

        //Add route to the map.
        var routeGraphic = new Graphic(directions.mergedGeometry, routeSymbol);
        map.graphics.add(routeGraphic);
        //routeGraphic.getDojoShape().moveToBack();
        //cts.geography.zoomToExtent(directions.extent);

        //Display the directions.
        var directionsInfo = directions.features;
        var directionsList = [];
        
        for(var i = 2; i< directionsInfo.length; i++){
            
            var prevFeature = directionsInfo[i-1];
            var feature = directionsInfo[i];
            if(i == 1){
                
            }
            var driveTime = Math.floor(prevFeature.attributes.time).toString() + " min " + 
            				utilities.toFixed((prevFeature.attributes.time - Math.floor(prevFeature.attributes.time)) * 60, 0).toString() + " sec";
            var distanceText;
            
            if (prevFeature.attributes.length < .25) {
                distanceText = utilities.toFixed(prevFeature.attributes.length * 5280,0).toString() + " feet";
            } else {
                distanceText = utilities.toFixed(prevFeature.attributes.length, 1).toString() + " miles";
            }
            
            var lon = prevFeature.geometry.paths[0][prevFeature.geometry.paths[0].length-1][0];
            var lat = prevFeature.geometry.paths[0][prevFeature.geometry.paths[0].length-1][1];
            
            directionsList.push({
                "detail": feature.attributes.text,
                "distanceText": distanceText,
                "distanceMiles": prevFeature.attributes.length,
                "detail": feature.attributes.text,
                "driveTime": driveTime,
                "coordinate": {latitude: lat, longitude: lon}
            });
            
        }
        
        me.viewModel.set("directionsList", directionsList);
        console.log(JSON.stringify(directions));
        console.log(JSON.stringify(directionsList));
        
        
    };
    var vehicleLocationGraphic = null;
    var me = {
        init: function(){
            
            map = new Map("map", {
              basemap: "streets",
              center: [-98.5795,39.8282],
              zoom: 4,
              autoResize: false
            });
            
            
            dojo.connect(map, "onLoad", function(){
                //do nothing, may want to do some geolocation type things in here
            });
                
            amplify.subscribe("useNativeNavigator.changed",function(useNativeNavigator){
                
        		navigator.geolocation.getCurrentPosition(function(position){
                    me.positionRetrieved(position);
                    me.clearGeolocationWatch();
                    me.startGeolocationWatch(useNativeNavigator);
                });
            });
                
        },
        viewModel:kendo.observable({
            speakManeuver:false,
            lastDistanceFromNextManeuver: null,
            currentDestination:null,
            followVehicle:true,
            directionsList: [],
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
                var segment = e.data;
                var zoomLevel = 13;
                if(segment.distanceMiles < 1){
                    zoomLevel = 16;
                }
                var coordinate = segment.coordinate;
                //var startGraphic = createPointGraphic(coordinate.latitude,coordinate.longitude,'images/icon_map-start.png', 30, 40);
                //map.graphics.add(startGraphic);
                map.centerAndZoom(getWebPointFromLatLong(coordinate.latitude,coordinate.longitude),12);

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
        startGeolocationWatch: function(useNativeNavigator){
            traceController.logEvent("Starting geolocation watch.  NativeNavigator: " + useNativeNavigator ? "yes" : "no");
            	
            var geolocation = navigator.geolocation;
            if(useNativeNavigator)
            	geolocation = window.nativegeolocation;
                
            var options = {maximumAge: 5000, timeout: 5000,enableHighAccuracy: true};
            
            me.geolocationWatch = geolocation.watchPosition(me.positionRetrieved, function(error) {
                traceController.logEvent("There was an error obtaining geolocation information.",JSON.stringify(error));
                
                if(error.code == 1){
                    //permission error, try cordova navigator
                    navigator.geolocation.watchPosition(me.positionRetrieved, function(error) {
                        traceController.logEvent("There was an error obtaining geolocation information.",JSON.stringify(error));
                    }, options);
                }
            }, options);
        },
        positionRetrieved: function(position) {
                
		    var lastGpsInfo = me.getGpsInfo()            

            //32 meters or .02 miles
            //50 meters or .03 miles
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
                
                //if(me.viewModel.get("speakManeuver")){
                //    var directions = me.viewModel.get("directionsList")[0];
                //    me.viewModel.set("speakManeuver",false);
                //    window.plugins.tts.speak("in " + directions.distanceText + " " + directions.detail,function(){},function(){});
                //}
                
                if(me.viewModel.get("mapsActive")){ 
                    
                    //var directionsList = me.viewModel.get("directionsList");
            		//var nextManeuver = directionsList[0]; 
                    //var distanceFromNextManeuver = utilities.calculateDistance(nextManeuver.coordinate.latitude, nextManeuver.coordinate.longitude, position.coords.latitude, position.coords.longitude)
                    //var distanceRemaining = nextManeuver.distanceMiles;

                    //var lastDistanceFromNextManeuver = me.viewModel.get("lastDistanceFromNextManeuver");
                    //if (distanceFromNextManeuver < .02){
                    //    //we are at the location of the maneuver so shift it off the array and we assume we are headed to the next manuever
                	//	tts.speak(directionsList[0].detail,function(){},function(){});
                    //    directionsList.shift();
                    //	me.viewModel.set("directionsList",directionsList);
                    //	me.viewModel.set("lastDistanceFromNextManeuver",null);
                    //    me.viewModel.set("speakManeuver",true);
                		
                    //} else if (lastDistanceFromNextManeuver && lastDistanceFromNextManeuver < distanceFromNextManeuver){
                    //    //we are getting farther away so reroute
                    //	window.plugins.tts.speak("re-routing",function(){},function(){});
                    //    me.mapRoute();
                    //	me.viewModel.set("lastDistanceFromNextManeuver",null);
                    //} else{
                            
                    //    distanceRemaining = distanceRemaining - distanceMoved;
                    //    var distanceText;
                    //     if (distanceRemaining < .25) {
                    //        distanceText = utilities.toFixed(distanceRemaining * 5280,0).toString() + " ft";
                    //    } else {
                    //        distanceText = utilities.toFixed(distanceRemaining, 1).toString() + " mi";
                    //    }
                    //    me.viewModel.set("directionsList[0].distanceMiles",nextManeuver.distanceMiles -distanceMoved);
                    //    me.viewModel.set("directionsList[0].distanceText",distanceText);
                    //    //if we get this far we are just driving the route
                    //    me.viewModel.set("lastDistanceFromNextManeuver",distanceFromNextManeuver);
                    //}
                    
                   if(vehicleLocationGraphic != null){
                    	map.graphics.remove(vehicleLocationGraphic);                
                    }
                    vehicleLocationGraphic = createPointGraphic(position.coords.latitude,position.coords.longitude,'images/icon_map-vehicleOnTime.png', 30, 40);
                    map.graphics.add(vehicleLocationGraphic);
                    
                    var zoomLevel = 13;
                    //if(distanceRemaining < 1){
                    //    zoomLevel = 16;
                    //}
                    
                    if(me.viewModel.get("followVehicle")){
                        map.centerAndZoom(getWebPointFromLatLong(position.coords.latitude,position.coords.longitude), zoomLevel);
                        
                    } 
                    
                    
                }
            }
            
            lastGpsInfo.accuracy = position.coords.accuracy;
            lastGpsInfo.speed = position.coords.speed * 2.23694;
            lastGpsInfo.timeTaken = utilities.getCurrentUTC();
            traceController.logEvent("Setting GPS postion.", lastGpsInfo);
            me.setGpsInfo(lastGpsInfo);
            
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
            var routeTask = new RouteTask("http://usloft1491.serverloft.com:6080/arcgis/rest/services/Route/NAServer/Route");
            //we only set gpsinfo when we know it is accurate so this just grabs last known accurate location.
            var lastGpsInfo = me.getGpsInfo();
            //setup the route parameters
            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = Units.MILES;
    
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
