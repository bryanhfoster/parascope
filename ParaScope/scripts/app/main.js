//this is in global scope and needs to be exposed so that we can bind to the viewmodel on the UI
var parascope;
var kendoApp;
var exec;
var map;
var tabstrip;

       
require(["app/parascope"], function (app) {     
    parascope = app;
    $(document).ready(function () {   
    	document.addEventListener("deviceready", function(){
            parascope.init();
        })
        document.addEventListener("backbutton", function(e){
            //this used to work by the id of the view, but kendo changed it to be the path, hence the slash...
            //leaving both in case it acts different on different devices or they change it back
            if(kendoApp.view().id != "#loginView" && kendoApp.view().id != "/"){
            	kendoApp.navigate("#routeView");                    
            }   			
    	});    
    });
});


