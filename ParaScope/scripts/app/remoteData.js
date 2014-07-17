define(["app/constants","app/traceController","app/utilities"],
function (constants,traceController, utilities) {
    var me = {
        loadEmptyDriverReport: function(callback){
            $.ajax({
                type: "GET",
                cache: false,
                url: constants.serviceUrl + "GetEmptyDriverReport",
                contentType: "application/json; charset=utf-8",
                dataType: "json"})
                .done(function (result) {
                    callback(result);
                })
                .fail(function(error){
                	me.submitErrorReport(JSON.stringify(error));
                    callback(null);
                });
        },
        submitDriverReport: function(driverReport,callback){
            
            var serviceURL = constants.serviceUrl + "SubmitDriverReport";
            var d = new Date();
			var n = d.getMinutes();
            var breakIt = n % 2 == 0;
            
            //debugger;
            if(breakIt)
            	//serviceURL = "fuck";
            
            $.ajax({
                type: "POST",
                url: serviceURL,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(driverReport)
                })
                .done(function (result) {
                    callback(result);
                }).fail(function(error){
                    me.submitErrorReport(JSON.stringify(error));
                    callback(error);
                });
        },
        getRouteUpdate: function(deviceIdentifier,companyName,softwareVersion,callback){
            $.ajax({
                type: "GET",
                cache: false,
                url: constants.serviceUrl + "GetRouteUpdate/" + deviceIdentifier + "/" + companyName + "/" + softwareVersion,
                contentType: "application/json; charset=utf-8",
                dataType: "json"})
                .done(function (result) {
                    callback(result);
                })
                .fail(function(error){
                    me.submitErrorReport(JSON.stringify(error));
                    callback(null);
                });
        },
        login: function(credentials,callback){
           var jsonstring = JSON.stringify(credentials);
            //jsonstring = jsonstring.substring(0, jsonstring.length - 10);
            //debugger;
            $.ajax({
                type: "POST",
                url: constants.serviceUrl + "Login",
                contentType: "application/json; charset=utf-8",
                data: jsonstring,
                dataType: "json"})
                .done(function (result) {
                    callback(result);
                })
                .fail(function(error){
                    me.submitErrorReport(JSON.stringify(error));
                    callback(null);
                });
        },
        getCurrentSoftwareVersion: function(){
            return utilities.ajaxGet(constants.serviceUrl + "GetCurrentSoftwareVersion");
            //$.ajax({
            //    type: "GET",
            //    cache: false,
            //    url: constants.serviceUrl + "GetCurrentSoftwareVersion",
            //    contentType: "application/json; charset=utf-8",
            //    dataType: "json"})
            //    .done(function (result) {
            //        callback(result);
            //    })
            //    .fail(function(error){
            //        me.submitErrorReport(JSON.stringify(error));
            //        callback(null);
            //    });
        },
        submitErrorReport: function(errorString){
            
            var fullReport = "PARASCOPE ERROR: ";

            try{
                var deviceInformation = localStorage.getItem("DeviceInformation");
                if(deviceInformation != "undefined"){
                    
                    var deviceInformationObject = JSON.parse(deviceInformation);
                    
            	    fullReport = fullReport.concat("\nCustomer: " + deviceInformationObject.Customer);
            		fullReport = fullReport.concat("\nDeviceDescription: " + deviceInformationObject.DeviceDescription);
            		fullReport = fullReport.concat("\nDeviceIdentifier: " + deviceInformationObject.Identifier);
                    
                }
            } catch(error) {
            	fullReport = fullReport.concat("\nError parsing device information: " + JSON.stringify(error));
            }
            
			fullReport = fullReport.concat("\nError: " + errorString);
            
            $.ajax({
                type: "POST",
                cache: false,
                url: constants.serviceUrl + "submitErrorReport",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(fullReport),
                dataType: "json"})
                .done(function (result) {
                    //do nothing
                })
                .fail(function(error){
                    //this is still not full proof, we are offline and need to store locally or try and resend when online
                });
        }
    };
    
    return me;    
    
});