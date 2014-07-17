define([],
function () {
    var makeRequest = function (serviceName, data, type) {
            var options = {
                cache: false,
                type: type,
                url: serviceName,
                dataType: "json",
                data: data
            };

            var deferred = $.Deferred();
            $.ajax(options)
                .done(function(result) {
                    deferred.resolve(result);
                })
                .fail(function (result) {
                    deferred.reject(result);
                });
            return deferred.promise();
        };
    
    var me = {
        init: function() {
    	},        
        ajaxGet: function (serviceName, data) {
            return makeRequest(serviceName, data,  "GET");
        },
        ajaxPost: function (serviceName, data) {
            return makeRequest(serviceName, data,  "POST");
        },
        isValidNumber: function (n) {
          return !isNaN(parseFloat(n)) && isFinite(n) && n >= 0;
        },
        makeValidNumber: function (n) {
          return me.isValidNumber(n) ? n : 0;
        },
        getGuid: function(){
            return (me.S4() + me.S4() + "-" + me.S4() + "-4" + me.S4().substr(0,3) + "-" + me.S4() + "-" + me.S4() + me.S4() + me.S4()).toLowerCase();
        },
        S4: function(){
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        },
        calculateDistance: function (lat1, lon1, lat2, lon2) {
            var R = 6371; // km
            var dLat = (lat2-lat1)* Math.PI / 180;
            var dLon = (lon2-lon1)* Math.PI / 180;
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1* Math.PI / 180) * Math.cos(lat2* Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c;
            return d/1.609344;//divide by this to get miles
        },
        getCurrentUTC: function(){
            var date = new Date();
            return date.toISOString();
        },
        toFixed: function(num, fixed) {
            fixed = fixed || 0;
            fixed = Math.pow(10, fixed);
            return Math.floor(num * fixed) / fixed;
        },
        mapFromArray: function (array, prop) {
            var map = {};
            for (var i=0; i < array.length; i++) {
                map[ array[i][prop] ] = array[i];
            }
            return map;
        },
        isEqual: function(a, b) {
            return a.ScheduledStartTime === b.ScheduledStartTime && a.Address === b.Address;
        },
        getDelta: function(o, n,key)  {
            var delta = [];
            var mapO = me.mapFromArray(o, key);
            var mapN = me.mapFromArray(n, key);    
            for (var id in mapO) {
                if (!mapN.hasOwnProperty(id)) {
                    mapO[id].delta = "Removed";
                    delta.push(mapO[id]);
                } else if (!me.isEqual(mapN[id], mapO[id])){
                    mapN[id].delta = "Changed";
                    delta.push(mapN[id]);
                }
            }
            
            for (var id in mapN) {
                if (!mapO.hasOwnProperty(id)) {
                    mapN[id].delta = "Added";
                    delta.push(mapN[id]);
                }
            }
            return delta;
        }
    };    
    return me;
});


