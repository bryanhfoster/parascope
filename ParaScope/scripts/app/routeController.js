define(["app/communicationManager","app/geographyController","app/utilities"],
function (communicationManager,geographyController,utilities) {  
           
                var canvas,canvas2,signaturePad,signaturePad2,validator; 
    
    var me = {        
        init: function(){
            //alert(new Date());
            //$("#groupArriveView").kendoMobileModalView("open"); 
        },
        viewModel:kendo.observable({
            showDebugView: function(){
                $("#debugView").kendoMobileModalView("open");                
            },
            signature:null,
            showSignature: function(){
                return !(me.viewModel.get("signature") == null);  
            },
            job: null,
            userMessage: null,
            route: null,
            currentOdometer: 0,
            allowPerformNoShow: false,
            currentNoShowReason:null,
            currentSignatureReason:null,
            canSubmitLogoff: false,
            signatureCaptured: false,
            jobsToGroupArrive: [],
            currentJobType: function(){
                var currentJob = me.viewModel.get("job");
                if (currentJob.JobType == "1") {
                    return "Pick-Up";
                }else if (currentJob.JobType == "2") {
                    return "Drop-Off"
                } 
            },
            formatCurrentJobSpecialAssistance: function(){
                var currentJob = me.viewModel.get("job");
                return currentJob.SpecialAssistance.join(",");
            },
            formatCurrentJobTime: function(){
                var currentJob = me.viewModel.get("job");
                return currentJob.ScheduledStartTimeString;
            },
            formatTime: function(dateFromTheServer){
                
                var dte = eval("new " + dateFromTheServer.slice(1, -1));
                return kendo.toString(dte,"HH:mm");
            },
            jobSource: function(){
                var ds =  new kendo.data.DataSource({
                  data: [1,2,3]
                });
                return ds;
            },
            incrementField: function(e){
                var field = $(e.currentTarget).data("field");
                var fieldValue = me.viewModel.get(field);
                if(!fieldValue || fieldValue == "" || parseInt(fieldValue,10) == "NaN"){
                    me.viewModel.set(field,1);
                }else{
                	me.viewModel.set(field,parseInt(fieldValue,10) + 1);                    
                }
            },
            decrementField: function(e){
                var field = $(e.currentTarget).data("field");
                var value = me.viewModel.get(field);
                if (value > 0){
                    me.viewModel.set(field,parseInt(me.viewModel.get(field),10) - 1);                      
                }             
            },
            noShowReasonSelected: function(e){
                me.viewModel.set("allowPerformNoShow",true);
                me.viewModel.set("currentNoShowReason",$(e.currentTarget).data("value"));
                $("#noShowReasons > div").toggleClass("active",false);
                $(e.currentTarget).toggleClass("active",true);
            },
            signatureReasonSelected: function(e){
                me.viewModel.set("signatureReasonIsSelected",true);
                me.viewModel.set("currentSignatureReason",$(e.currentTarget).data("value"));
                $("#signatureReasons > div").toggleClass("active",false);
                $(e.currentTarget).toggleClass("active",true);
            },
            allowConfirmSignature: function(){
                return me.viewModel.get("signatureReasonIsSelected") 
                        && (me.viewModel.get("currentSignatureReason") == "Rider Unable to Sign" 
                        || me.viewModel.get("currentSignatureReason") == "Rider Refused to Sign" 
                        || me.viewModel.get("signatureCaptured"));
            },
            showGeography: function(){                
                    kendoApp.navigate("#geographyView");
            },
            startRoute: function(){
                if (!validator.validate()) {
                   return;
                }
                var route = me.viewModel.get("route");
                me.viewModel.set("currentOdometer", route.ExpectedRouteStartOdometer);
                geographyController.setOdometer(route.ExpectedRouteStartOdometer);
                communicationManager.addRouteStartReport(route.ExpectedRouteStartOdometer,route.VehicleNumber);
                //me.viewModel.set("route.HasBeenStarted",true);
                me.viewModel.route.HasBeenStarted = true;
                me.viewModel.trigger("change");
                
                //var listView = $("#jobList").data("kendoMobileListView");

                //look for the pretrip and set it to started
                var jobIndex = null;
                $.grep(route.Jobs,function(element,index){
                    if(element.JobType == 4){
                        jobIndex = index;
                    }
                });
                if(jobIndex != null){
                    //me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);
                    me.viewModel.route.Jobs[jobIndex].HasBeenStarted=true;
                	me.viewModel.route.Jobs.trigger("change");
                }
                
                // refreshes the list view
                //listView.refresh();
                $("#startRouteView").kendoMobileModalView("close");
                
            },
            getOdometerFromGeography: function(){
                return utilities.toFixed(geographyController.getOdometer(),0);
            },
            showEndRoute: function(){                
                me.viewModel.set("canSubmitLogoff", !me.viewModel.get("route").DriverSignatureRequired);
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                //$("#endRouteView").kendoMobileModalView("open");   
                kendoApp.navigate("#endRouteView");
                validator = $("#endRouteView").kendoValidator().data("kendoValidator");
                if(!canvas2){
                    canvas2 = document.querySelector("#canvas2");
                    signaturePad2 = new SignaturePad(canvas2);         
                    signaturePad2.onEnd = function(){                    
                        me.viewModel.set("canSubmitLogoff", true);
                    }
                }
                
                canvas2.width = $("#canvasContainer2").width()-50;
                canvas2.height = 180;//$(window).height()- 100;
                signaturePad2.clear();
            },
            hideEndRoute: function(){
                kendoApp.navigate("#:back");
            },
            endRoute: function(){
                if (validator && !validator.validate()) {
                   return;
                }

                me.viewModel.set("route", null);
                var odometer = me.viewModel.get("currentOdometer");
                var signature = signaturePad2.toDataURL();
                communicationManager.addRouteEndReport(odometer, signature, me.viewModel.endRouteCompleted);
                //$("#endRouteView").kendoMobileModalView("close");
                $("#routeEndingView").kendoMobileModalView("open");
            },
            endRouteCompleted: function(){
                setTimeout(function(){
                    $("#routeEndingView").kendoMobileModalView("close");
                    kendoApp.navigate("#loginView");
                },1000)
            },
            showStartRoute: function(){
                $("#startRouteView").kendoMobileModalView("open");                
                validator = $("#startRouteView").kendoValidator().data("kendoValidator");
            },
            hideStartRoute: function(){
                $("#startRouteView").kendoMobileModalView("close");
            },
            showConfirmCallRider: function(e){
                me.viewModel.set("job",e.data);
                $("#confirmCallRiderView").kendoMobileModalView("open");
            },
            hideConfirmCallRider: function(){
                $("#confirmCallRiderView").kendoMobileModalView("close");
            },
            showRouteUpdatedView: function(){
                $("#routeUpdatedView").kendoMobileModalView("open");
            },
            hideRouteUpdatedView: function(){
                $("#routeUpdatedView").kendoMobileModalView("close");
            },
            hideConfirmArrive: function(){
                $("#confirmArriveView").kendoMobileModalView("close");
            },
            arriveJob: function(e){
                var job = e.data;
                me.viewModel.set("job", job);
                me.viewModel.arriveJob2(job, false);
            },
            arriveJobConfirmed: function(){
                me.viewModel.arriveJob2(me.viewModel.get("job"), true);
                $("#confirmArriveView").kendoMobileModalView("close");
            },
            arriveJob2: function(job, force){
                var jobIndex = null;
                var rideId = job.RideId;
                var jobType = job.JobType;
                
                var gpsInfo = geographyController.viewModel.get("gpsInfo");
                var distanceToJob = job.Coordinate ? utilities.calculateDistance(job.Coordinate.Latitude, job.Coordinate.Longitude, 
                                            gpsInfo.latitude, gpsInfo.longitude) : null;
                var location = job.RiderFirstName + " " + job.RiderLastName + ", " + job.LocationName + " " + job.Address;
                
                if(!force && distanceToJob == null){
                    //alert("location unknown");
                    me.viewModel.set("confirmArriveText", "Job location is unknown, are you sure you want to arrive this job: " + location + "?");
                    $("#confirmArriveView").kendoMobileModalView("open");
                }
                //if we are more than half a mile away
                if(!force && distanceToJob > .5){
                    //alert("too far away");
                    me.viewModel.set("confirmArriveText", "Job location is not within range, are you sure you want to arrive this job: " + location + "?");
                    $("#confirmArriveView").kendoMobileModalView("open");
                    return;
                }
                
                var jobs = me.viewModel.get("route.Jobs");
                
                $.grep(me.viewModel.get("route.Jobs"),function(element,index){
                    if(element.Id ==job.Id)
                        jobIndex = index;
                });
                communicationManager.addJobArrival(jobType,rideId);
                
                
                //kendo bug: updating VM using this method unbinds click event from every other list item
                //me.viewModel.set("route.Jobs["+jobIndex+"].HasBeenStarted", true);
                //this is the original that quit working for no reason
                //me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);
                //even unbinds other list items when you do this
                //me.viewModel.get("route.Jobs")[jobIndex].set("foo", true); 
                
				//tried EVERY different approach here... no idea why the above doesnt work, but this is the only thing that will update list without unbinding clicks from other items
                me.viewModel.route.Jobs[jobIndex].HasBeenStarted=true;
                me.viewModel.route.Jobs.trigger("change");
                
                //this is kindof silly that we assume this to be blank and just start pushing, should initialize a new one
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                //our list is always ordered by time so we can just iterate
                for(var i  = jobIndex+1; i < jobs.length; i++){
                    if ((eval("new " + jobs[i].ScheduledStartTime.slice(1, -1)).getTime() - eval("new " + job.ScheduledStartTime.slice(1, -1)).getTime()) < 600000){//ten minutes
                        if(!jobs[i].HasBeenStarted && jobs[i].ArriveEnabled && job.Coordinate && jobs[i].Coordinate && utilities.calculateDistance(job.Coordinate.Latitude,job.Coordinate.Longitude,jobs[i].Coordinate.Latitude,job.Coordinate.Longitude,jobs[i].Coordinate.Longitude) < .05){
                            jobsToGroupArrive.push({jobIndex:i,job:jobs[i]});
                        }
                    } else{
                        break;
                    }                    
                }
                if (jobsToGroupArrive.length > 0){

                    $("#groupArriveView").kendoMobileModalView("open");
                    var groupArriveView = $("#groupArriveView").data("kendoMobileModalView");
                    groupArriveView.scroller.reset();
                }
                
                
            },
            confirmGroupArrive: function(){
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                for(var i = 0; i < jobsToGroupArrive.length; i++){
                    communicationManager.addJobArrival(jobsToGroupArrive[i].job.JobType,jobsToGroupArrive[i].job.RideId);
                    //kendo sucks and this quit working for no reason, see comments above
                    //me.viewModel.get("route.Jobs")[jobsToGroupArrive[i].jobIndex].set("HasBeenStarted", true);  
                    me.viewModel.route.Jobs[jobsToGroupArrive[i].jobIndex].HasBeenStarted=true;
                }           
                me.viewModel.route.Jobs.trigger("change");
                
                //this empties the array on the VM, but should actually kill it and initialize again on next group arrive
                jobsToGroupArrive.splice(0,jobsToGroupArrive.length);
                $("#groupArriveView").kendoMobileModalView("close");      
            },
            cancelGroupArrive: function(){
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                jobsToGroupArrive.splice(0,jobsToGroupArrive.length);
                $("#groupArriveView").kendoMobileModalView("close"); 
            },
            callRider: function(){
               var job = me.viewModel.get("job");
               var rideId = job.RideId;
               communicationManager.addCallRequest(rideId);
               me.setUserMessage("Call is being sent");
               $("#confirmCallRiderView").kendoMobileModalView("close");
            },
            performJobClick: function(e){
                 var view = $("#routeView").data("kendoMobileView");
                    if(view){
                        view.scroller.reset();
                    }
                
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                
                me.viewModel.set("job",e.data);
                if(e.data.JobType == 1){
                    $("#performQuestionView").kendoMobileModalView("open");
                }
                else if(e.data.JobType == 2){
                    kendoApp.navigate("#performDropoffView");
                	validator = $("#performDropoffView").kendoValidator().data("kendoValidator"); 
                    me.viewModel.set("allowPerformDropoff",!e.data.SignatureRequired);
                }
                
            },
            clearSignature:function(){            	
                signaturePad.clear();  
                me.viewModel.set("signatureCaptured", false);
            },
            captureSignatureClick: function(e){
                           
                me.viewModel.set("currentSignatureReason",null);
                $("#signatureReasons > div").toggleClass("active",false);                
                me.viewModel.set("signatureReasonIsSelected",false);           
                me.viewModel.set("signatureCaptured",false);
                if(!canvas){
                    canvas = document.querySelector("canvas");
                    signaturePad = new SignaturePad(canvas);  
                    signaturePad.onEnd = function(){                    
                        me.viewModel.set("signatureCaptured", true);
                    }                  
                }
                
                signaturePad.clear();
                kendoApp.navigate("#captureSignatureView");
                
                canvas.width = $("#canvasContainer").width()-50;
                canvas.height = 180;//$(window).height()- 100;
            },
            captureSignatureOnDropoffClick: function(e){
                me.viewModel.set("signature",null);
                me.viewModel.set("allowPerformPickup",true);

                var job = me.viewModel.get("job");
                var dropoffindex = null;
                var dropoff = $.grep(me.viewModel.route.Jobs,function(element,index){
                    dropoffindex = index;
                    return element.RideId == job.RideId && element.JobType == 2;
                });
                
                me.viewModel.set("signature",null);
                me.viewModel.set("currentSignatureReason",'Will Capture Signature At Dropoff');
                me.viewModel.set("route.Jobs[" + dropoffindex + "].SignatureRequired",job.SignatureRequired);
            },
            cancelCaptureSignature: function(e){
                var job = me.viewModel.get("job");
                me.viewModel.set("allowPerformPickup",!job.SignatureRequired);
                kendoApp.navigate("#:back");
                me.viewModel.set("signature",null);
            },
            pickupPerformButtonText: function(){
                return me.viewModel.get("allowPerformPickup") ? "Perform" : "Signature Required";
            },
            dropoffPerformButtonText: function(){
                return me.viewModel.get("allowPerformDropoff") ? "Confirm Dropoff" : "Signature Required";
            },
            logoffPerformButtonText: function(){
                return me.viewModel.get("canSubmitLogoff") ? "Submit" : "Signature Required";
            },
            confirmCaptureSignature: function(e){
                var job = me.viewModel.get("job");

                
                var dropoffindex = null;
                var dropoff = $.grep(me.viewModel.route.Jobs,function(element,index){
                    dropoffindex = index;
                    return element.RideId == job.RideId && element.JobType == 2;
                });
                
                me.viewModel.set("route.Jobs[" + dropoffindex + "].SignatureRequired",false);
                
                //this is lame but just set them both since we don't know if we are capturing on pick or drop
                me.viewModel.set("allowPerformPickup",true);
                me.viewModel.set("allowPerformDropoff",true);
                kendoApp.navigate("#:back");
                me.viewModel.set("signature",signaturePad.toDataURL());
            },
            performNoShow: function(e){
				if (!validator.validate()) {
                   return;
                }
                var job = me.viewModel.get("job");
                var odometer = me.viewModel.get("currentOdometer");
                
                var noShowReasonId = me.viewModel.get("currentNoShowReason");
                
                communicationManager.addJobPerformNoShow(job.RideId,job.JobType,odometer,noShowReasonId);
                geographyController.setOdometer(odometer);
                var jobs = $.grep(me.viewModel.route.Jobs,function(element,index){
                    return element.RideId != job.RideId;
                });
                me.viewModel.set("route.Jobs",jobs);
                kendoApp.navigate("#routeView");
            },
            performPickup: function(e){
                if (!validator.validate()) {
                   return;
                }
                
                var job = me.viewModel.get("job");
                var odometer = me.viewModel.get("currentOdometer");
                var jobIndex = 0;
                
                var signature = me.viewModel.get("signature");
                var signatureReason = me.viewModel.get("currentSignatureReason");
                communicationManager.addJobPerformPickup(job.RideId,utilities.makeValidNumber(job.RideFare),job.JobType,utilities.makeValidNumber(job.NumberOfChildren),
                											utilities.makeValidNumber(job.Escorts),utilities.makeValidNumber(job.NumberOfPasses),odometer,signature,signatureReason);
                
                //clear signature                
                me.viewModel.set("signature",null);
                me.viewModel.set("currentSignatureReason",'');
                
                geographyController.setOdometer(odometer);
                var jobs = $.grep(me.viewModel.route.Jobs,function(element,index){
                    return element.Id != job.Id;
                });
                
                $.grep(jobs,function(element,index){
                     if(element.RideId == job.RideId)
                        jobIndex = index;
                });
                jobs[jobIndex].ArriveEnabled = true;
                me.viewModel.set("route.Jobs",jobs);
                kendoApp.navigate("#routeView");
            },
            performDropoff: function(e){
                if (!validator.validate()) {
                   return;
                }
                var job = me.viewModel.get("job");
                var odometer = me.viewModel.get("currentOdometer");
                var jobIndex = 0;
                
                var signature = me.viewModel.get("signature");
                var signatureReason = me.viewModel.get("currentSignatureReason");
                
                communicationManager.addJobPerformDropoff(job.RideId,odometer,job.JobType,signature,signatureReason);
                //doing this just like we do on pickup, but need to ensure that nothing lingers since we are using stupid local variable for this
                //ensure that signatures for 
                //clear signature                
                me.viewModel.set("signature",null);
                me.viewModel.set("currentSignatureReason",'');
                
                geographyController.setOdometer(odometer);
                 //Remove job from the array list
                var jobs = $.grep(me.viewModel.route.Jobs,function(element,index){
                    return element.Id != job.Id;
                });
                me.viewModel.set("route.Jobs",jobs);
                kendoApp.navigate("#routeView");
                
                validator = $("#performDropoffView").kendoValidator().data("kendoValidator");
            },
            startButtonClick: function(e){
                var jobIndex = null;
                var job = e.data;
                                
                var odometer = me.viewModel.get("currentOdometer");
                var nonServiceMessage = {nonServicePeriodReportType:0,nonServicePeriodType:job.JobType,odometer:odometer};
                
                $.grep(me.viewModel.get("route.Jobs"),function(element,index){
                    if(element.Id ==e.data.Id)
                        jobIndex = index;
                });
                communicationManager.addNonServiceReport(nonServiceMessage);
                //me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);  
                me.viewModel.route.Jobs[jobIndex].HasBeenStarted=true;
                me.viewModel.route.Jobs.trigger("change");
            
            },
            finishButtonClick: function(e){
                var view = $("#routeView").data("kendoMobileView");
                    if(view){
                        view.scroller.reset();
                    }
                
                var job = e.data;
                var odometer = me.viewModel.get("currentOdometer");
                                
                var nonServiceMessage = {nonServicePeriodReportType:1,nonServicePeriodType:job.JobType,odometer:odometer};
                
                communicationManager.addNonServiceReport(nonServiceMessage);
                 //Remove job from the array list
                var jobs = $.grep(me.viewModel.route.Jobs,function(element,index){
                    return element.Id != job.Id;
                });
                me.viewModel.set("route.Jobs",jobs);
            },
            navigatePickupPerform: function(e){
                var job = me.viewModel.get("job");
                me.viewModel.set("allowPerformPickup",!job.SignatureRequired);
                
                
                me.viewModel.set("signature",null);
                me.viewModel.set("currentSignatureReason",null);
                
                //Get Odometer from Geography
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                kendoApp.navigate("#performPickupView");
                
                validator = $("#performPickupView").kendoValidator().data("kendoValidator");
                $("#performQuestionView").kendoMobileModalView("close");
                
            },
            allowPerformPickup: false,
            navigateNoShow: function(e){
                me.viewModel.set("allowPerformNoShow",false);
                var job = me.viewModel.get("job");
                //Get Odometer from Geography
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                kendoApp.navigate("#performNoShowView");
                $("#performQuestionView").kendoMobileModalView("close");
                $("#noShowReasons > div").toggleClass("active",false);
                validator = $("#performNoShowView").kendoValidator().data("kendoValidator");
                
            },
            navigateMaintenance: function(e){

                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                
            },
            viewButtonClick: function(e){
                me.viewModel.set("job",e.data);
                kendoApp.navigate("#detailView");
            },
            cancelPerform: function(e){
                kendoApp.navigate("#routeView");
            },
            cancelPerformQuestion: function(e){
                $("#performQuestionView").kendoMobileModalView("close");
            },
            mapJob: function(e){
                //need to change that to mapview
                kendoApp.navigate("#mapView");
                geographyController.viewModel.activateMaps();
                //geographyController.mapRoute(e.data.Coordinate.Latitude,e.data.Coordinate.Longitude);
                geographyController.setDestination({address:e.data.Address, latitude:e.data.Coordinate.Latitude,longitude:e.data.Coordinate.Longitude});
            },
            mapJobEnabled: function(e){
                if(e.Coordinate && e.Coordinate.Latitude != 0){                    
                    return true;                    
                } else{
                    return false;
                }
                        
            },
            startButtonIsVisible: function(){
                return !me.viewModel.get("route.HasBeenStarted");
            },
            isRouteStarted: function(){
                return route.HasBeenStarted;
            },
            showRouteEndButton: function(){
                //leaving these silly variables here instead of putting them all on return statement to prove that:
                //in order to have a calculated field we HAVE to get("propertyName") the exact properties we want to monitor
                var test1 = this.get("route");
                var test2 = this.get("route.Jobs.length");
                if(test1 && test2 == 0){
                    var view = $("#routeView").data("kendoMobileView");
                    if(view){
                        view.scroller.reset();
                    }
                }
                return test1 && test2 == 0;
            },
            gallons: null,
            cost: null,
            sendFluidsReport: function(){
               validator = $("#maintenanceView").kendoValidator().data("kendoValidator");
               if (!validator.validate()) {
                   return;
                }
                var odometer = me.viewModel.get("currentOdometer");
                geographyController.setOdometer(odometer);
                communicationManager.addFluidsReport(me.viewModel.get("gallons"),me.viewModel.get("cost"),odometer);
                me.viewModel.set("cost",null);
                me.viewModel.set("gallons",null);
                //me.viewModel.set("odometer",null);
                alert("Successfully Submitted.");
                kendoApp.navigate("#routeView");
            }
        }),
        getRoute: function() {
            var routeBefore = me.viewModel.get("route");
            var routeAfter = communicationManager.getRoute();
            
            if(routeBefore != null){
                var delta = utilities.getDelta(routeBefore.Jobs,routeAfter.Jobs,"Id");
                
                if(delta.length > 0){
                    var template = kendo.template($("#routeUpdatedTemplate").html());                
                    var result = kendo.render(template, delta); //Execute the template                
                    $("#routeViewHeader").append('<div class="alert alert-warning alert-dismissable" data-dismiss="alert"> <div class="row"><div class="col-xs-11"><strong><h2><ul>' + result + '</ul></h2></strong></div><div class="col-lg-1"><div class="pull-right" data-dismiss="alert"><i class="icon-remove-sign icon-2x"></i></div></div></div></div>');
                    navigator.notification.beep(2);
                     var view = $("#routeView").data("kendoMobileView");
                    if(view){
                        view.scroller.reset();
                    }
                }
            }
            
        	me.viewModel.set("route", routeAfter);
            //navigator.notification.beep(2)
            //me.setEndRouteButtonVisibility();
            //if(routeBefore == null){
            //    me.viewModel.route.bind("change", me.setEndRouteButtonVisibility);
            //}
        },
        setEndRouteButtonVisibility: function(){
            if(me.viewModel.get("route.Jobs").length > 0){
                $("#endRouteButton").hide();
            } else{
                $("#endRouteButton").show();            
            }
        },
        setUserMessage: function(message){
            $('#performPickupView .well').removeClass("hide");
            me.viewModel.set("userMessage",message);            
            setTimeout(function() {
              me.viewModel.set("userMessage","");
                $('#performPickupView .well').addClass("hide");
            }, 3000);
        }
    };
    
    kendo.bind($("#routeViewHeader"),me.viewModel);
    
    return me;
    
});
