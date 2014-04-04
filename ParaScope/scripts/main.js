//require.config({
//    paths: {
//        jQuery: "lib/jquery.min",
//        text: "lib/text",
//        kendo: "lib/kendo.mobile.min",
//        PUBNUB: "lib/pubnub-3.5.3.min",
//        cordova: "../cordova"
//    },
//    shim: {
//        jQuery: {
//            exports: "jQuery"
//        },
//        PUBNUB: {
//            exports: "PUBNUB"
//        },
//        cordova: {
//            exports: "cordova"
//        },
//        kendo: {
//            deps: ["jQuery"],
//            exports: "kendo"
//        }
//    }
//});


//this is in global scope and needs to be exposed so that we can bind to the viewmodel on the UI
var parascope;
var kendoApp;
var exec;
var map;
var tabstrip;


dojo.addOnLoad(function(){  
    require(["app/parascope"],
    function(app){
        parascope = app;
        $(document).ready(function () {   
    		document.addEventListener("deviceready", function(){
                parascope.init();
            })
            document.addEventListener("backbutton", function(e){
                kendoApp.navigate("#routeView");    			
			});
            
            $("[cts-bind]").each(
            function(){
                var binding = eval("({" + $(this).attr("cts-bind") + "})");
                for (var key in binding) {
                  if (binding.hasOwnProperty(key)) {
                      $(this).bind(key,binding[key])
                  }
                }
            }); 
            
            //$("input").focus(function() {
            //     //$(this)[0].scrollIntoView();
            //     $('html, body').animate({
            //         scrollTop: $(this)[0].offset().top
            //     }, 2000);
            // });
            
            
    	}); 
    });
});              

    


