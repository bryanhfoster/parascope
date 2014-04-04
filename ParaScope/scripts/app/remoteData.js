define(["app/constants","app/traceController"],
function (constants,traceController) {
    return {
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
                    .fail(function(){
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
                }).fail(function(result){
                    callback(result);
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
                .fail(function(){
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
                    callback(null);
                });
        },
        getCurrentSoftwareVersion: function(callback){
            $.ajax({
                type: "GET",
                cache: false,
                url: constants.serviceUrl + "GetCurrentSoftwareVersion",
                contentType: "application/json; charset=utf-8",
                dataType: "json"})
                .done(function (result) {
                    callback(result);
                })
                .fail(function(error){
                    callback(null);
                });
        }
    };
    
    
    
});