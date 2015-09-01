define(["app/constants"],
function(constants){
    
    var templatesToLoad = [
        {name:"messageTemplate",type:"template"},
        {name:"jobTemplate",type:"template"},
        {name:"jobScrollTemplate",type:"template"},
        {name:"predefinedMessageTemplate",type:"template"},
        {name:"directionsTemplate",type:"template"},
        {name:"groupArriveTemplate",type:"template"},
        {name:"routeUpdatedTemplate",type:"template"},
        {name:"eventTemplate",type:"template"},
        {name:"loginView",type:"html"},
        {name:"jobDetailView",type:"html"},
        {name:"routeView",type:"html"},
        {name:"messagesView",type:"html"},
        {name:"predefinedMessageView",type:"html"},
        {name:"maintenanceView",type:"html"},
        {name:"performPickupView",type:"html"},
        {name:"performDropoffView",type:"html"},
        {name:"performNoShowView",type:"html"},
        {name:"performQuestionView",type:"html"},
        {name:"captureSignatureView",type:"html"},
        {name:"mapView",type:"html"},
        {name:"startRouteView",type:"html"},
        {name:"endRouteView",type:"html"},
        {name:"settingsView",type:"html"},
        {name:"debugView",type:"html"},
        {name:"routeEndingView",type:"html"},
        {name:"confirmCallRiderView",type:"html"},
        {name:"groupArriveView",type:"html"},
        {name:"confirmArriveView",type:"html"},
        {name:"softwareUpdatingView",type:"html"}
    ];
    
    //this loads the text of these files
    var filesToLoad = $.map(templatesToLoad, function(val) {
        return "dojo/text!./" + constants.templateDirectory + val.name + ".html";
    });
    
    return {
        loadTemplates: function(){
            var deferred = $.Deferred();
            require(
                filesToLoad,
                function() {                    
                    for(var i = 0; i < templatesToLoad.length; i++) {
                        //stupid fucking kendo simulator injects this script so we have to replace it
                        arguments[i] = arguments[i].replace("<script>window.parent.ice.client.deviceMockService.mockDevice()</script>","");
                        //we only call this when doc is ready, but may need to check for that here???
                        if(templatesToLoad[i].type == "template"){
                            $("body").append("<script id='" + templatesToLoad[i].name + "' type='text/x-kendo-template'>" + arguments[i] + "</scr" + "ipt>");                            
                        } else{
                            $("body").append(arguments[i]);  
                        }
                    }   
                    deferred.resolve();
                });
            return deferred.promise();
        }
    };
});




            
            