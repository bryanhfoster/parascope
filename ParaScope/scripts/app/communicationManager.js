define(["app/localData","app/remoteData","app/constants","app/utilities","app/geographyController","app/traceController"],
function (localData,remoteData,constants,utilities,geographyController,traceController) {
    
	var pubnubIsConnected = true;
    var lastGPSReportTimestamp = new Date();
    var deviceIdentifier = null;
    var updateCallback = null;
    var exceptionHandler = null;
    var subscribedToUpdates = false;
    var sendReportInterval = null;
    var companyName = null;
    var pingTimeout;
    var me = {
        needToGetUpdates: false,
        init: function(onUpdateCallback,onExceptionHandler) {
            traceController.logEvent("communication manager initialized.");
            updateCallback = onUpdateCallback;    
            exceptionHandler = onExceptionHandler;            
    	},
        getCurrentSoftwareVersion: function(){
            return remoteData.getCurrentSoftwareVersion();
            
            //remoteData.getCurrentSoftwareVersion(function(version){
            //    callback(version);
            //});            
        },
        setConnectionByCustomerName: function(customerName){
                if (customerName.indexOf("qa.") >= 0){
                    constants.baseUrl = constants.qaBaseUrl;
                    constants.serviceUrl = constants.qaServiceUrl;
                    //$("#geographyTab").show();
                    
                    //remove environment message
                    $("div[data-role='header'] .alert").remove();   
                    
                   //inject environment message
                    //$("div[data-role='header']").append('<div class="alert alert-warning"><i class="icon-warning-sign"></i> <strong>Currently in QA Environment.</strong></div>');
                    
                    
                    return customerName.replace("qa.","");
                } else if(customerName.indexOf("dev.") >= 0){
                    constants.baseUrl = constants.devBaseUrl;
                    constants.serviceUrl = constants.devServiceUrl;
                    
                    //remove environment message
                    $("div[data-role='header'] .alert").remove(); 
                    
                    //inject environment message
                    //$("div[data-role='header']").append('<div class="alert alert-warning"><i class="icon-warning-sign"></i> <strong>Currently in DEVELOPMENT Environment.</strong></div>');
                    
                    return customerName.replace("dev.","");                    
                } else {
                    constants.baseUrl = constants.liveBaseUrl;
                    constants.serviceUrl = constants.liveServiceUrl;
                    
                    //remove environment message
                    $("div[data-role='header'] .alert").remove(); 
                    
                    return customerName;
                }
            
        },
        authenticate: function(password, customer,description, callback) {
            var customerNameToLoginWith = me.setConnectionByCustomerName(customer);
            //need to store local var for this so we can 
            companyName = customerNameToLoginWith;
    		//Check to see if we have device information
            me.clearLocalDataOnLogin();
    		var deviceInformation = localData.loadDeviceInformation();
    		if (deviceInformation == null) {
    			//We don't have device information so save it to the phone for the future
    			deviceInformation = {};
    			deviceInformation.Identifier = utilities.getGuid();
    		}
    	    deviceInformation.Customer = customer;
    		deviceInformation.DeviceDescription = description;
    		localData.saveDeviceInformation(deviceInformation);
            
            //this is the local version that is stored and we want to access later
            deviceIdentifier = deviceInformation.Identifier;
            
    		//Create credentials to send to the server for authenicating the phone
    		var credentials = {};
    		credentials.CompanyName = customerNameToLoginWith;
    		credentials.CurrentSoftwareVersion = constants.currentSoftwareVersion;
    		credentials.DeviceDescription = deviceInformation.DeviceDescription;//device.name + "-" + device.platform + "-" + device.version;
    		credentials.DeviceIdentifier = deviceInformation.Identifier;
    		credentials.Password = password;
            
    		remoteData.login(credentials, function(result, error) {
                if (error){
                    callback("There was a network error, please try again.");
                    return;
                }

    			if (result.AuthenticationError == null) {
                    sendReportInterval = setInterval(function(){
                        me.sendDriverReport();
                    }, 60000);

                    geographyController.setOdometer(result.Route.ExpectedRouteStartOdometer);
    				localData.saveRoute(result.Route);
    				localData.savePredefinedMessages(result.AvailablePredefinedMessages);
    				if (result.Messages != null) {
    					localData.saveDriverMessages(result.Messages);
    				}
                    if(!subscribedToUpdates){
                        subscribedToUpdates = true;
                        me.subscribeToUpdates();                        
                    }
    				callback(null);
    			}
    			else {
                    var message = "There was a problem logging in: <br/>";
                    
                    if(result.AuthenticationError == 1){
                        message = message + "Invalid Customer Name";
                    }
                    if(result.AuthenticationError == 2){
                        message = message + "Invalid Password";
                    }
                    if(result.AuthenticationError == 3){
                        message = message + "No Routes Exist For Driver";
                    }
                    if(result.AuthenticationError == 4){
                        message = message + "Software Update Required";
                    }  
                    if(result.AuthenticationError == 5){
                        message = message + "There was an unknown server error. Please try again or contact support.";
                    }                 
    				callback(message);
    			}
    		});
    	},
        subscribeToUpdates: function() {
	        var pubnub = PUBNUB.init({publish_key : constants.publishKey , subscribe_key : constants.subscribeKey});
            traceController.logEvent("Subscribing to PubNub." + deviceIdentifier);
    		pubnub.subscribe({
    			channel: deviceIdentifier,
    			callback: function (message) {
                    traceController.logEvent("PubNub ping recieved from server.");
    				//we want to wrap this in a helper function
    				me.needToGetUpdates = true;
                    //in case 10 pings come in at once we want to wait until we are done recieving them to call send report
                    //this will happen if we are offline for a while
                    clearTimeout(pingTimeout);
                    pingTimeout = setTimeout(function() {
                        me.sendDriverReport();
                    },2000); 
    			},
    			restore: true,
    			connect: function () {
                    traceController.logEvent("PubNub first connection established.");
    				//First time connected
    				pubnubIsConnected = true;
                    me.setDeviceStatus();
                                        
                    remoteData.submitErrorReports();
    			},
    			disconnect: function () {
                    traceController.logEvent("PubNub disconnected.");
    				//show user they are offline
    				pubnubIsConnected = false;
                    me.setDeviceStatus();
    			},
    			reconnect: function () {
                    traceController.logEvent("PubNub connection re-established.");
    				pubnubIsConnected = true;
                    me.setDeviceStatus();
    				if (me.needToGetUpdates) {
    					me.sendDriverReport();
    				}                    
                    
                    remoteData.submitErrorReports();                    
    			}     
    		});
    	},
        deviceIsConnected: function() {
            var networkState = navigator.connection.type;

            var states = {};
            states[Connection.UNKNOWN]  = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI]     = 'WiFi connection';
            states[Connection.CELL_2G]  = 'Cell 2G connection';
            states[Connection.CELL_3G]  = 'Cell 3G connection';
            states[Connection.CELL_4G]  = 'Cell 4G connection';
            states[Connection.NONE]     = 'No network connection';
            
            traceController.logEvent("Connection Status - Pubnub: " + pubnubIsConnected + ", Device: " + states[networkState]);
            var isConnected = pubnubIsConnected && states[networkState] != 'No network connection';
            parascope.setDeviceStatus(isConnected);
            return isConnected;
        },
        getRoute: function() {
    		return localData.loadRoute();
    	},
        getUpdates: function() {
    		if (me.deviceIsConnected()) {
               traceController.logEvent("Attempting to get updates from server.");
                
    		   //may need to do this here me.needToGetUpdates = false;
                
               remoteData.getRouteUpdate(deviceIdentifier,companyName,constants.currentSoftwareVersion,function(result) {
        				if (result != null) {
        					localData.saveRoute(result.Route);
                            
                            traceController.logEvent("Successfully retrieved updates from server."); 
                            
        					if (result.Messages != null) {
        						localData.saveDriverMessages(result.Messages);
        					}
        					//Events
                            updateCallback();
    		                me.needToGetUpdates = false;
                            traceController.logEvent("Successfully retrieved updates from server.");
        				} else{
                            traceController.logEvent("There was an error getting updates from server.");                            
                        }
        			}, function() {
        				//Do nothing for now we have an HTTP Error
                        traceController.logEvent("There was an error getting updates from server.");
                        //me.needToGetUpdates is still = true so we'll check again in 1 minute
        			});
    		}
            me.setDeviceStatus();
    	},
        getPredefinedMessages: function() {
    		var predefinedMessages = localData.loadPredefinedMessages();
    	    return predefinedMessages;
    	},
        getMessages: function(){
            var driverMessages = localData.loadDriverMessages();
            return driverMessages;
        },
        addGPSReport: function(lastGpsInfo){
           //check to see if the interval is set otherwise don't keep piling on gps reports
           if(sendReportInterval && lastGPSReportTimestamp && new Date() - lastGPSReportTimestamp > 60000){
                lastGPSReportTimestamp = new Date();
                var driverReport = localData.loadDriverReport();
                if(driverReport == null){
                    driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
                }
                driverReport.GpsReports.push({Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed});
                localData.saveDriverReport(driverReport);
            }
            //store everything if needed
        },
        addEventReport: function(events){
          
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            for(var i = 0; i < events.length; i++){
                driverReport.EventReports.push(events[i]);
            }
            //driverReport.EventReports = events;
            localData.saveDriverReport(driverReport);
            //me.sendDriverReport();
           
        },
        addReplyToMessage: function(answer, originalMessageId, dismiss) {
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var replyToMessage = {Answer:answer,OriginalMessageId:originalMessageId,Dismiss:dismiss};

            var lastGpsInfo = geographyController.getGpsInfo();
            replyToMessage.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};

            driverReport.MessageReplies.push(replyToMessage);
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
    	},
        addCallRequest: function(rideId){
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var callRequest = {OccuranceDateJson:utilities.getCurrentUTC(),RideId:rideId};
            
            var lastGpsInfo = geographyController.getGpsInfo();
            callRequest.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};
            
            driverReport.CallRequests.push(callRequest);
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
        },
        addJobArrival: function(jobType,rideId,currentOdometer){
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            //TODO add odometer to object when server is ready
            var jobArrival = {JobType:jobType,OccuranceDateJson:utilities.getCurrentUTC(),RideId:rideId};
            
            var lastGpsInfo = geographyController.getGpsInfo();
            jobArrival.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};
            
            driverReport.JobArrivals.push(jobArrival);
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
        },
        addRouteStartReport: function(odometer, vehicleNumber){
           
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            driverReport.RouteStartReport = {RouteStartOdometer:odometer,OccuranceDateJson:utilities.getCurrentUTC(),VehicleNumber:vehicleNumber};
            localData.saveDriverReport(driverReport);
            
            //we have not logged in before now, so any changes that may have happened since we started previewing
    		me.needToGetUpdates = true;
            me.sendDriverReport();
        },
        addNonServiceReport: function(nonServiceMessage){
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var nonServicePeriod = {NonServicePeriodReportType:nonServiceMessage.nonServicePeriodReportType,NonServicePeriodType:nonServiceMessage.nonServicePeriodType,OccuranceDateJson:utilities.getCurrentUTC(),Odometer:nonServiceMessage.odometer};
            
            var lastGpsInfo = geographyController.getGpsInfo();
            nonServicePeriod.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};
            
            driverReport.NonServicePeriodReports.push(nonServicePeriod);
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
        },
        addRouteEndReport: function(odometer, signature, callback){
            
            var driverReport = localData.loadDriverReport();
            
            me.reportSubmittedCallbackHandler = function(){
                clearInterval(sendReportInterval);
                sendReportInterval = null;
                callback();
            };
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            driverReport.LogoffReport = {Odometer:odometer, DriverSignature:signature, OccuranceDateJson:utilities.getCurrentUTC()};
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
        },
        addMessage: function(messageId) {
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var message = {OccuranceDateJson:utilities.getCurrentUTC(),PredefinedMessageId:messageId};
            
            var lastGpsInfo = geographyController.getGpsInfo();
            message.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};
            
            driverReport.Messages.push(message);
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
    	},
        addFluidsReport: function(gallons, cost, odometer) {
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var fluids = {
                OccuranceDateJson:utilities.getCurrentUTC(),
                TotalGallons:gallons,
                TotalCost:cost,
                Odometer: odometer
            };           
             
            driverReport.FluidsReport = fluids;
            localData.saveDriverReport(driverReport);
            
            me.sendDriverReport();
    	},
        addJobPerformNoShow: function(rideId, jobType, odometer,noShowReason){
            var jobPerform = {FareCollected:null,JobType:jobType,NoShowReason:noShowReason,NumberOfChildren:null,NumberOfEscorts:null,NumberOfPasses:null,OccuranceDateJson:utilities.getCurrentUTC(),RideId:rideId,Odometer:odometer};
            me.addJobPerform(jobPerform);
        },
        addJobPerformPickup: function(rideId, fareCollected, jobType, numberOfChildren, numberOfEscorts, 
        								numberOfPasses, odometer, signature, signatureReason){
            var jobPerform = {
                FareCollected:fareCollected,
                JobType:jobType,
                NoShowReason:null,
                NumberOfChildren:numberOfChildren,
                NumberOfEscorts:numberOfEscorts,
                NumberOfPasses:numberOfPasses,
                OccuranceDateJson:utilities.getCurrentUTC(),
                RideId:rideId,
                Odometer:odometer, 
                Signature:signature, 
                SignatureReason:signatureReason
            };            
            me.addJobPerform(jobPerform);
        },
        addJobPerformDropoff: function(rideId, odometer, jobType, signature, signatureReason){
            var jobPerform = {
                FareCollected:null,
                JobType:jobType,
                NoShowReason:null,
                NumberOfChildren:null,
                NumberOfEscorts:null,
                NumberOfPasses:null,
                OccuranceDateJson:utilities.getCurrentUTC(),
                RideId:rideId,
                Odometer:odometer, 
                Signature:signature, 
                SignatureReason:signatureReason
            };
            me.addJobPerform(jobPerform);
        },
        addJobPerform: function(jobPerform){
            var driverReport = localData.loadDriverReport();
            if(driverReport == null){
                driverReport = me.createEmptyDriverReport(localData.loadDeviceInformation().Identifier);
            }
            var lastGpsInfo = geographyController.getGpsInfo();
            jobPerform.GpsReport = {Latitude:lastGpsInfo.latitude,Longitude:lastGpsInfo.longitude,OccuranceDateJson:lastGpsInfo.timeTaken,Speed:lastGpsInfo.speed};
            
            driverReport.JobPerforms.push(jobPerform);
            localData.saveDriverReport(driverReport);
            me.sendDriverReport();
        },
        reportSubmittedCallbackHandler: null,
        sendDriverReport: function(){
            
            //we always need to send driver report before getting updates... 
            //do nothing if not connected, but if there is a driver report to send then only get updates on the success callback
            //if there is no driver report and we need to get updates then go for it
            if(me.deviceIsConnected()){
                var driverReport = localData.loadDriverReport();
                localData.saveDriverReport(null);
                
                if(driverReport != null){
                    traceController.logEvent("Attempting to submit driver report.");
                    //expected responses
                    //InvalidSession = 1
                    //InvalidDeviceIdentifier = 2
                    //InValidSoftwareVersion = 3
                    //UnknownError = 4
                    //InvalidCustomerName = 5
                    //Successful = 0
                    remoteData.submitDriverReport(driverReport,
                        function(result) {
                			if (result == 0) {
                				//success
                                //clear out the eventreport part of the driver report or else it will get recursively bigger
                                driverReport.EventReports = [];
                                traceController.logEvent("Successfully submitted driver report.",driverReport);
                                if(me.reportSubmittedCallbackHandler){
                                    me.reportSubmittedCallbackHandler();
                                    me.reportSubmittedCallbackHandler = null;
                                }
                                if(me.needToGetUpdates){
                                    //this recursively calls send report until driver report is blank and then we can get updates... HAVE to fully process driver reports before we can get updates from server
                                    me.getUpdates();
                                }
                			} else{   
                                var forceLogoff = false;
                                if(result == 1 || result == 3){
                                    //only time we force logoff is if software is out of date or session has died
                                    forceLogoff = true;
                                }
                                
                                //how bad is the error
                                if(forceLogoff){
                                    clearInterval(sendReportInterval);
                                    sendReportInterval = null;
                                    //this is the fatal exception handler that logs them out, consider handling a bit more gracefully
                                    //also note that this is the only place we call this!!!
                                    exceptionHandler();
                                } else{
                                    //if unsuccessful then we need to merge this report with whatever the current one is...   
                                    //traceController.logEvent("There was an error submitting driver report. Report: ",driverReport);  
                                    traceController.logEvent("There was an error submitting driver report. Error: ",result);
                                    me.mergeDriverReports(driverReport);
                                }
                            }                    
            		    });
                } else{
                    if(me.needToGetUpdates){
                        me.getUpdates();
                    }
                }
                
            }else{                
                traceController.logEvent("Attempted to send driver report but we are offline.");
            }         
            me.setDeviceStatus();
        },
        mergeDriverReports: function(driverReportToMerge){
            traceController.logEvent("Merging driver reports due to failed attempt to submit.");
            var driverReport = localData.loadDriverReport();
            
            if(driverReport == null){
                driverReport = driverReportToMerge;
            } else{
                var i;
                for(i = 0; i < driverReportToMerge.CallRequests.length; i++){
                    driverReport.CallRequests.push(driverReportToMerge.CallRequests[i]);
                }
                for(i = 0; i < driverReportToMerge.GpsReports.length; i++){
                    driverReport.GpsReports.push(driverReportToMerge.GpsReports[i]);
                }
                for(i = 0; i < driverReportToMerge.JobArrivals.length; i++){
                    driverReport.JobArrivals.push(driverReportToMerge.JobArrivals[i]);
                }
                for(i = 0; i < driverReportToMerge.JobPerforms.length; i++){
                    driverReport.JobPerforms.push(driverReportToMerge.JobPerforms[i]);
                }
                for(i = 0; i < driverReportToMerge.MessageReplies.length; i++){
                    driverReport.MessageReplies.push(driverReportToMerge.MessageReplies[i]);
                }
                for(i = 0; i < driverReportToMerge.Messages.length; i++){
                    driverReport.Messages.push(driverReportToMerge.Messages[i]);
                }
                for(i = 0; i < driverReportToMerge.NonServicePeriodReports.length; i++){
                    driverReport.NonServicePeriodReports.push(driverReportToMerge.NonServicePeriodReports[i]);
                }
                for(i = 0; i < driverReportToMerge.EventReports.length; i++){
                    driverReport.EventReports.push(driverReportToMerge.EventReports[i]);
                }
                if(driverReportToMerge.LogoffReport){
                    driverReport.LogoffReport = driverReportToMerge.LogoffReport;
                }
                if(driverReportToMerge.FluidsReport){
                    driverReport.FluidsReport = driverReportToMerge.FluidsReport;
                }
            }
            localData.saveDriverReport(driverReport);
        },
        createEmptyDriverReport: function(deviceIdentifier){
            var report = {"CallRequests":[],"DeviceIdentifier":deviceIdentifier,"GpsReports":[],"JobArrivals":[],"JobPerforms":[],"MessageReplies":[],"Messages":[],"NonServicePeriodReports":[],"EventReports":[]};
            report.CompanyName = companyName;
    		report.CurrentSoftwareVersion = constants.currentSoftwareVersion;
            return report;
        },
        clearLocalDataOnLogin: function(){
            localData.saveDriverReport(null);
    		localData.saveRoute(null);
        },
        clearLocalData: function() {
        	//This is used to reset the simulator local storage, because 
        	//there is no other way at this point
    		localData.saveDeviceInformation(null);
    		localData.saveDriverReport(null);
    		localData.saveRoute(null);
    	},
        setDeviceStatus: function() {
            //var driverReport = localData.loadDriverReport();
            //if(driverReport != null){
            //    var numberOfItems = 0;
            //    numberOfItems += driverReport.GpsReports.length;
            //    numberOfItems += driverReport.JobArrivals.length;
            //    numberOfItems += driverReport.CallRequests.length;
            //    numberOfItems += driverReport.JobPerforms.length;
            //    numberOfItems += driverReport.Messages.length;
            //    numberOfItems += driverReport.NonServicePeriodReports.length;
            //    if(driverReport.RouteStartReport != null){
            //        numberOfItems += 1;
            //    }
            //    parascope.setDeviceStatus(pubnubIsConnected,numberOfItems);
            //}
            //else{
            //    parascope.setDeviceStatus(pubnubIsConnected,0);
            //}
        }
    };
    return me;
	
});