define(["app/communicationManager","app/geographyController","app/utilities"],
function (communicationManager,geographyController,utilities) {  
           
                var canvas,signaturePad,validator; 
    
    var me = {        
        init: function(){
            //alert(new Date());
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
                me.viewModel.set("allowConfirmSignature",true);
                me.viewModel.set("currentSignatureReason",$(e.currentTarget).data("value"));
                $("#signatureReasons > div").toggleClass("active",false);
                $(e.currentTarget).toggleClass("active",true);
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
                me.viewModel.set("route.HasBeenStarted",true);
                var listView = $("#jobList").data("kendoMobileListView");

                //look for the pretrip and set it to started
                var jobIndex = null;
                $.grep(route.Jobs,function(element,index){
                    if(element.JobType == 4){
                        jobIndex = index;
                    }
                });
                if(jobIndex != null){
                    me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);
                }
                
                // refreshes the list view
                listView.refresh();
                $("#startRouteView").kendoMobileModalView("close");
                
            },
            getOdometerFromGeography: function(){
                return utilities.toFixed(geographyController.getOdometer(),0);
            },
            showEndRoute: function(){                
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                $("#endRouteView").kendoMobileModalView("open");                
                validator = $("#endRouteView").kendoValidator().data("kendoValidator");
            },
            hideEndRoute: function(){
                $("#endRouteView").kendoMobileModalView("close");
            },
            endRoute: function(){
                if (validator && !validator.validate()) {
                   return;
                }
                me.viewModel.set("route", null);
                var odometer = me.viewModel.get("currentOdometer");
                communicationManager.addRouteEndReport(odometer,me.viewModel.endRouteCompleted);
                $("#endRouteView").kendoMobileModalView("close");
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
            arriveJob: function(e){
                var jobIndex = null;
                var job = e.data;
                var rideId = job.RideId;
                var jobType = job.JobType;
                
                var jobs = me.viewModel.get("route.Jobs");
                
                $.grep(me.viewModel.get("route.Jobs"),function(element,index){
                    if(element.Id ==e.data.Id)
                        jobIndex = index;
                });
                communicationManager.addJobArrival(jobType,rideId);
                me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);
                
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                //our list is always ordered by time so we can just iterate
                for(var i  = jobIndex+1; i < jobs.length; i++){
                    if ((eval("new " + jobs[i].ScheduledStartTime.slice(1, -1)).getTime() - eval("new " + job.ScheduledStartTime.slice(1, -1)).getTime()) < 10){
                        if(!jobs[i].HasBeenStarted && job.Coordinate && jobs[i].Coordinate && utilities.calculateDistance(job.Coordinate.Latitude,job.Coordinate.Longitude,jobs[i].Coordinate.Latitude,job.Coordinate.Longitude,jobs[i].Coordinate.Longitude) < .05){
                            jobsToGroupArrive.push({jobIndex:i,job:jobs[i]});
                        }
                    } else{
                        break;
                    }                    
                }
                if (jobsToGroupArrive.length > 0){
                    $("#groupArriveView").kendoMobileModalView("open");                    
                }
            },
            confirmGroupArrive: function(){
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                for(var i = 0; i < jobsToGroupArrive.length; i++){
                    communicationManager.addJobArrival(jobsToGroupArrive[i].job.JobType,jobsToGroupArrive[i].job.RideId);
                    me.viewModel.get("route.Jobs")[jobsToGroupArrive[i].jobIndex].set("HasBeenStarted", true);                    
                }           
                jobsToGroupArrive.splice(0,jobsToGroupArrive.length);
                $("#groupArriveView").kendoMobileModalView("close");      
            },
            cancelGroupArrive: function(){
                var jobsToGroupArrive = me.viewModel.get("jobsToGroupArrive");
                jobsToGroupArrive.splice(0,jobsToGroupArrive.length);
                $("#groupArriveView").kendoMobileModalView("close"); 
            },
            callRider: function(){
                //TODO Fix changes I made in error
               var job = me.viewModel.get("job");
               var rideId = job.RideId;
               //var jobIndex = 0;
               //$.grep(me.viewModel.get("route.Jobs"),function(element,index){
               //    if(element.Id == job.Id)
               //         jobIndex = index;
               //});
                //should this be rideid or jobid? how do we know what number to call????
               communicationManager.addCallRequest(rideId);
               me.setUserMessage("Call is being sent");
               $("#confirmCallRiderView").kendoMobileModalView("close");
            },
            performJobClick: function(e){
                
                me.viewModel.set("currentOdometer",me.viewModel.getOdometerFromGeography());
                
                me.viewModel.set("job",e.data);
                if(e.data.JobType == 1){
                    $("#performQuestionView").kendoMobileModalView("open");
                }
                else if(e.data.JobType == 2){
                    kendoApp.navigate("#performDropoffView");
                	validator = $("#performDropoffView").kendoValidator().data("kendoValidator");
                    
                }
            },
            clearSignature:function(){            	
                signaturePad.clear();  
            },
            captureSignatureClick: function(e){
                           
                me.viewModel.set("currentSignatureReason",null);
                $("#signatureReasons > div").toggleClass("active",false);                
                me.viewModel.set("allowConfirmSignature",false);
                if(!canvas){
                    canvas = document.querySelector("canvas");
                    signaturePad = new SignaturePad(canvas);                    
                }
                
                signaturePad.clear();
                kendoApp.navigate("#captureSignatureView");
                
                canvas.width = $("#canvasContainer").width()-50;
                canvas.height = 180;//$(window).height()- 100;
            },
            cancelCaptureSignature: function(e){
                var job = me.viewModel.get("job");
                me.viewModel.set("allowPerformPickup",!job.SignatureRequired);
                kendoApp.navigate("#performPickupView");
                me.viewModel.set("signature",null);
            },
            pickupPerformButtonText: function(){
                return me.viewModel.get("allowPerformPickup") ? "Perform" : "Signature Required";
            },
            confirmCaptureSignature: function(e){
                me.viewModel.set("allowPerformPickup",true);
                kendoApp.navigate("#performPickupView");
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
                
                communicationManager.addJobPerformDropoff(job.RideId,odometer,job.JobType);
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
                me.viewModel.get("route.Jobs")[jobIndex].set("HasBeenStarted", true);                
            
            },
            finishButtonClick: function(e){
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
                geographyController.setDestination({latitude:e.data.Coordinate.Latitude,longitude:e.data.Coordinate.Longitude});
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
                return test1 && test2 == 0;
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
                    $("div[data-role='header']").append('<div class="alert alert-warning alert-dismissable" data-dismiss="alert"> <div class="row"><div class="col-lg-11"><strong><h2><ul>' + result + '</ul></h2></strong></div><div class="col-lg-1"><div class="pull-right" data-dismiss="alert"><i class="icon-remove-sign icon-2x"></i></div></div></div></div>');
                    navigator.notification.beep(2);
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
    
    kendo.bind($("#header"),me.viewModel);
    
    return me;
    
});
