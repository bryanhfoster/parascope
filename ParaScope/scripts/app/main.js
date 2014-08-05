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
            if(kendoApp.view().id != "#loginView"){
            	kendoApp.navigate("#routeView");                    
            }   			
    	});    
    });
});


