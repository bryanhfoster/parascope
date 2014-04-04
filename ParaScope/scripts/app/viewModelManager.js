define(["jQuery", "kendo","app/communicationManager"],
function($,kendo,communicationManager) {
    
    var kendoApp;
    
    var me = {
        viewModel: kendo.observable({
            currentUser: null,
            currentOdometer: 0,
            messages: null,
            predefinedMessages: null,
            numberOfMessages: 0,
            showStartButton: true,
            gpsInfo: {accuracy:0,odometer:0,speed:null,latitude:null,longitude:null,timeTaken:null},
            selectCategory: function (e) {
                if(!me.viewModel.get("showStartButton")){
                	me.viewModel.set("job", null);
                	me.viewModel.set("job", e.dataItem);
                	kendoApp.navigate("#detailView");
                }
            },
            perform: function(e) {
            	me.viewModel.route.Jobs.remove(me.viewModel.job);
                communicationManager.performJob(me.viewModel.job);
            },
            startRoute: function(){
                var route = me.viewModel.get("route");
                me.viewModel.set("currentOdometer", route.ExpectedRouteStartOdometer);
                communicationManager.sendRouteStartReport( route.ExpectedRouteStartOdometer,route.VehicleNumber);
                me.viewModel.set("showStartButton",false);
                $("#modalview-startRoute").kendoMobileModalView("close");
            },
            cancelStartRoute: function(){
                $("#modalview-startRoute").kendoMobileModalView("close");
            }
        }),
        getGpsInfo: function(){
            return me.viewModel.get("gpsInfo");        
        },
        setGpsInfo: function(gpsInfo){
            me.viewModel.set("gpsInfo", gpsInfo);
        },    
        getRoute: function() {
        	me.viewModel.set("route", communicationManager.getRoute());
        },    
        updateComplete: function() {
        	me.getRoute();
            me.getMessages();
        }
    };   
    return me;
});
