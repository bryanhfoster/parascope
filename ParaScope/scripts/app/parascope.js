define(["kendo","app/communicationManager","app/templateLoader","app/loginController","app/routeController","app/messagesController","app/geographyController","app/traceController"],
function (kendo,communicationManager,templateLoader,loginController,routeController,messagesController,geographyController,traceController) {
    return {
        init: function(){
            //always load all templates first
            //this error happens when kendo tries to bind a template that is not present... should be fixed with deferred, but doesn't always seem to work
            //Uncaught TypeError: Cannot call method 'replace' of undefined 
            var def = templateLoader.loadTemplates();
            
            def.done(function(){
                kendoApp = new kendo.mobile.Application(document.body,{initial:"loginView", skin:"flat"});
                
                //stupid but kendo wasn't fully initialized and doesn't have a ready method so we have to put this in a timeout.
                setTimeout(function(){
                    loginController.init();
                    routeController.init();
                    //messagesController.init(); //this now gets initialized after login
                    geographyController.init();  
                    traceController.init(); 
                },1000);
            });
            
            
            $("#logoff").click(routeController.viewModel.endRoute);
            
            //then if we are on a tab then activate plugins... if window.plugins is null then we are in a simulator so we skip that step so as to avoid errors
            if (window.plugins){
                window.plugins.powerManagement.dim();
            
                //window.plugins.tts.startup(function(){},function(){});
                //window.plugins.tts.speak("Welcome to parascope.",function(){},function(){});
                
                //window.plugins.statusBarNotification.notify("Parascope", "Welcome!", Flag.FLAG_NO_CLEAR);
                
                setTimeout(function(){
                    
                    //window.plugins.statusBarNotification.notify("Something", "something just happened!!!!");
                    //window.plugins.tts.speak("something just happened!!!!",function(){},function(){});
            		//navigator.notification.beep(2);  
                },20000);
            }
            
            
            kendo.data.binders.date = kendo.data.Binder.extend({
                init: function (element, bindings, options) {
                    kendo.data.Binder.fn.init.call(this, element, bindings, options);
             
                    this.dateformat = $(element).data("dateformat");
                },
                refresh: function () {
                    var data = this.bindings["date"].get();
                    if (data) {
                        var dateObj = new Date(data);
                        $(this.element).text(kendo.toString(dateObj, this.dateformat));
                    }
                }
            });
            
            //new esri.Map("map_canvas", {
            //    basemap: "streets",
            //    center: [-93.5, 41.431],
            //    zoom: 5
            //});
            
            
                           
            communicationManager.init(
                //route updated callback
                function(){
                    routeController.getRoute();
                    messagesController.getMessages();
                },
                //errorhandler
                function(){                                   
                    routeController.viewModel.set("route", null);
                    $("#routeEndingView").kendoMobileModalView("close");
                    kendoApp.navigate("#loginView");    
                    alert("There was an error sending the driver report, your session died or your software is out of date, please log back in.");                      
                });
            comm = communicationManager;
        },
        controllers: {
            login: loginController,
            route: routeController,
            messages: messagesController,
            geography: geographyController,
            trace: traceController
        },
        setDeviceStatus: function(isOnline, numberOfMessages){
            if(isOnline){

                $("#deviceStatus").css('color', '#39b3d7');
                //$("#deviceStatus")[0].innerHTML = "";          
            }
            else{
                $("#deviceStatus").css('color', '#ccc');
                //$("#deviceStatus")[0].innerHTML = "Number of Queued Message: "+numberOfMessages;
            }
            
        }        
    };
    
});