define([],
function () {
    var me = {
        loadDriverReport: function () {
            var driverReport = localStorage.getItem("DriverReport");
            if(driverReport !== "undefined"){
                return JSON.parse(driverReport);
            }
            return null;
        },
        saveDriverReport: function (object) {
            localStorage.setItem("DriverReport", JSON.stringify(object));
        },
        loadDeviceInformation: function() {
            var deviceInformation = localStorage.getItem("DeviceInformation");
            if(deviceInformation != "undefined"){
                return JSON.parse(deviceInformation);
            }
            return null;
        },
        saveDeviceInformation: function(object){
            localStorage.setItem("DeviceInformation", JSON.stringify(object));
        },
        loadRoute: function(){
            var route = localStorage.getItem("RouteUpdate");
            if(route !== "undefined"){
                return JSON.parse(route);
            }
            return null;
        },
        saveRoute: function(object){
            localStorage.setItem("RouteUpdate",JSON.stringify(object));
        },
        loadPredefinedMessages: function(){
            var predefinedMessages = localStorage.getItem("PredefinedMessages");
            if(predefinedMessages !== "undefined"){
                return JSON.parse(predefinedMessages);
            }
        },
        savePredefinedMessages: function(object){
            localStorage.setItem("PredefinedMessages",JSON.stringify(object));
        },
        loadDriverMessages: function(){
            var driverMessages = localStorage.getItem("Messages");
            if(driverMessages !== "undefined"){
                return JSON.parse(driverMessages);  
            }
            return null;
        },
        saveDriverMessages: function(object){
            localStorage.setItem("Messages",JSON.stringify(object));
        }  
    };   
    
    return me;
});