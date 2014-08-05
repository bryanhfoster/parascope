define(["app/constants","app/traceController","app/localData","app/utilities"],
function (constants,traceController,localData,utilities) {
    var me =  {
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
                	me.storeErrorReport(JSON.stringify(error));
                    callback(null);
                });
        },
        submitDriverReport: function(driverReport,callback){
            $.ajax({
                type: "POST",
                url: constants.serviceUrl + "SubmitDriverReport",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(driverReport)
                })
                .done(function (result) {
                    callback(result);
                }).fail(function(error){
                    me.storeErrorReport(JSON.stringify(error));
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
                    me.storeErrorReport(JSON.stringify(error));
                    callback(null);
                });
        },
        login: function(credentials,callback){
            $.ajax({
                type: "POST",
                url: constants.serviceUrl + "Login",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(credentials),
                dataType: "json"})
                .done(function (result) {
                    callback(result);
                })
                .fail(function(error){
                    me.storeErrorReport(JSON.stringify(error));
                    callback(null, error);
                });
        },
        getCurrentSoftwareVersion: function(callback){
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
            //        me.storeErrorReport(JSON.stringify(error));
            //        callback(null);
            //    });
        },
        storeErrorReport: function(errorString){
            
            var fullReport = "PARASCOPE ERROR: ";

            try{
                var deviceInformation = localStorage.getItem("DeviceInformation");
                if(deviceInformation != "undefined"){
                    
                    var deviceInformationObject = JSON.parse(deviceInformation);
                    
            	    fullReport = fullReport.concat("\\nCustomer: " + deviceInformationObject.Customer);
            		fullReport = fullReport.concat("\\nDeviceDescription: " + deviceInformationObject.DeviceDescription);
            		fullReport = fullReport.concat("\\nDeviceIdentifier: " + deviceInformationObject.Identifier);
                    
                }
            } catch(error) {
            	fullReport = fullReport.concat("\\nError parsing device information: " + JSON.stringify(error));
            }
            
			fullReport = fullReport.concat("\\nError: " + errorString);
            
            var errorReports = localData.loadErrorReports();
            errorReports.push(fullReport);
            localData.saveErrorReports(errorReports);
            
            me.submitErrorReports();
            
        },
        submitErrorReports: function(){
            
            var errorReports = localData.loadErrorReports();
            
            if(errorReports && errorReports.length > 0){
                var errorReport = errorReports.pop();
                localData.saveErrorReports(errorReports);
            
                $.ajax({
                    type: "POST",
                    cache: false,
                    url: constants.serviceUrl + "submitErrorReport",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(errorReport),
                    dataType: "json"})
                    .done(function (result) {
                        me.submitErrorReports();
                    })
                    .fail(function(error){
                        //was not submitted, eventually we could even tell the user that they are fucked, but for now we'll try again next time we are online
                    });
            }
        }
    };
    return me;  
    
});