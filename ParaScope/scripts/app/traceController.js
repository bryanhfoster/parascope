define(["app/utilities"],
function (utilities) {
    var me = {
        init: function() {
            //kendo.bind($("#events"),me.viewModel);
    	},  
        viewModel:kendo.observable({
            hideDebugView: function(){
                $("#debugView").kendoMobileModalView("close");                
            },
            sendTrace: function(){ 
                var eventsJSON = localStorage.getItem("Events");
                var events;
                
                if(typeof(eventsJSON) !== "undefined"){
                    events =  JSON.parse(eventsJSON);
                    if(!events){
                        events = [];
                    }
                } 
                
                comm.addEventReport(events);
                
                localStorage.setItem("Events", JSON.stringify([]));
                me.viewModel.set("events",[]); 
            },
            events:[],
            sendTraceToServer:false,
            useNativeNavigator:false,
            nativeNavigatorChanged: function(){
                amplify.publish("useNativeNavigator.changed",me.viewModel.get("useNativeNavigator"));
            }
        }),        
        logEvent: function(event,object)  {
            
            var objectString = "";
            if(object){
                objectString = JSON.stringify(object);
            }
            
            var eventsJSON = localStorage.getItem("Events");
            var event = {Description:event,Details:objectString,EventTimeJson:utilities.getCurrentUTC()};
            
            if(eventsJSON != "undefined"){
                events =  JSON.parse(eventsJSON);
                if(!events){
                    events = [];
                }
                if(events.length == 50){
                    events.pop();
                }
                events.unshift(event);   
            } else{
                events = [event];
            }
            
            var sendTraceToServer = me.viewModel.get("sendTraceToServer"); 
            if(sendTraceToServer && typeof(comm) !== "undefined"){
                
                comm.addEventReport(events);
                
                localStorage.setItem("Events", JSON.stringify([]));
            } else{
                localStorage.setItem("Events", JSON.stringify(events));
                
            }
            
            var stupidFuckingKendo = me.viewModel.get("events");   
            me.viewModel.set("events",[]);            
            var newArray =  me.viewModel.get("events");
            newArray.push(event); 
            for(var i = 0; i < Math.min(5,stupidFuckingKendo.length); i++){
                newArray.push(stupidFuckingKendo[i]);                
            }
            
            me.viewModel.set("events",newArray);
        },        
        clearEvents: function(){
            
        }
    };    
    
    
    
    return me;
});


