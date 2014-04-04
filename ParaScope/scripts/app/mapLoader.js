      dojo.require("esri.map");
      var map;


      function initMap() {

        map = new esri.Map("map", {
          basemap: "streets",
          center: [-82.59, 35.56],
          zoom: 12,
          slider: false,
          autoResize: false
        });
        dojo.connect(map, "onLoad", mapLoadHandler);
      }

      function mapLoadHandler(map) {
          //why the fuck does resizing in here not work on the device!!!!
          //has to have to do with the fact that we haven't loaded that tab yet?
          //map.resize();
          
          
          //dojo.byId("map").style.height = (window.innerHeight) + "px";
       
      }     
      function addjustMapHeight() {
        dojo.byId("map_canvas").style.height = (window.innerHeight - headerGeom.h) + "px";
      }

     