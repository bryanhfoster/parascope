define(["app/communicationManager","app/routeController","app/geographyController","app/messagesController","app/constants","app/localData","app/utilities"],
function (communicationManager,routeController,geographyController,messagesController,constants,localData,utilities) {
    
    var me = {
        init: function(){
            $("#errorMessage").hide();
            
            var deviceInformation = localData.loadDeviceInformation();
            if (deviceInformation != null){
                me.viewModel.set("credentials.customer",deviceInformation.Customer);
                me.viewModel.set("credentials.description",deviceInformation.DeviceDescription);
                
                communicationManager.setConnectionByCustomerName(deviceInformation.Customer);
                //do NOT do this the first time the software runs...only need to do this 
                communicationManager.getCurrentSoftwareVersion(function(version){
                    if (version == null){
                        //there was a network error getting current software version but no need to tell them yet
                        return;
                    }
                    
                    if(version != constants.currentSoftwareVersion){
                        me.viewModel.versionUpdate(version);
                    }
                });
            } else{
                $("#settingsView").kendoMobileModalView("open");                
            }
        },
        viewModel:kendo.observable({            
            credentials: {customer:"",password:"",description:""},
            showDebugView: function(){
                $("#debugView").kendoMobileModalView("open");                
            },
            saveSettings: function(){
                var deviceInformation = localData.loadDeviceInformation();
        		if (deviceInformation == null) {
        			//We don't have device information so save it to the phone for the future
        			deviceInformation = {};
        			deviceInformation.Identifier = utilities.getGuid();
            	    deviceInformation.Customer = me.viewModel.get("credentials.customer");
            		deviceInformation.DeviceDescription = me.viewModel.get("credentials.description");
    		        localData.saveDeviceInformation(deviceInformation);
        		}
                $("#settingsView").kendoMobileModalView("close");
            },
            loginBeforeShow: function(){
                //any time we load login pae we want to clear the watch on geolocation
                geographyController.clearGeolocationWatch();
            },
            exitApp: function(){
                navigator.app.exitApp(); 
            },
            login: function() {
                kendoApp.showLoading();
            	var credentials = me.viewModel.get("credentials");
            	communicationManager.authenticate(credentials.password, credentials.customer, credentials.description, function(errorMessage){
                    if(!errorMessage){
                        //only watch geolocation when you are logged in to save battery
                        geographyController.startGeolocationWatch();
                        kendoApp.navigate("#routeView");
                        //this is so fucking stupid that we have to have a global variable set to the tabstrip the first time we launch it so we can use it in messages controller
                        //we have to access it to set number of messages, but it de kendomobiltabstripifies itself so we can't access it later
                        if (tabstrip == null){
                            tabstrip = $("#mainTabs").data("kendoMobileTabStrip");                            
                        }
                        kendoApp.hideLoading();
                        //not the biggest fan of having these dependencies here, but running out of ideas
                        routeController.getRoute();
                        messagesController.init();
                        messagesController.getMessages();
                        parascope.setDeviceStatus(true,0);
                        $("#errorMessage").html("");
                        $("#errorMessage").hide();
                    } else{
                        //show user error becasue they could not log in
                        $("#errorMessage").html(errorMessage);
                        $("#errorMessage").show();
                        kendoApp.hideLoading();
                        if(errorMessage == "There was a problem logging in: <br/>Software Update Required"){
                            communicationManager.getCurrentSoftwareVersion(function(version){
                                if(version != constants.currentSoftwareVersion){ 
                                    me.viewModel.versionUpdate(version);
                                }
                            });
                        }
                    }                    
                });   
            },
            hideSoftwareUpdating: function(){
                $("#softwareUpdatingView").kendoMobileModalView("close");
            },
            versionUpdate: function(version){
                
                alert("Software is out of date and will be updated automatically. Latest Version: " + version + ". Current Version: " + constants.currentSoftwareVersion); 
                $("#softwareUpdatingView").kendoMobileModalView("open");
                
                
                var fileName = "Parascope." + version + ".apk";
                var apkURL = constants.baseUrl+ "Mobile/" + fileName;    
                 
                //alert(apkURL);
                if (!window.plugins){
                    //we are not running on a tablet so return
                    return;
                }

               window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {

                   fileSystem.root.getFile('download/' + fileName, {
                       create: true, 
                       exclusive: false
                   }, function(fileEntry) {                       

                       var localPath = fileEntry.fullPath,
                       fileTransfer = new FileTransfer();        
                       fileTransfer.download(apkURL, localPath, function(entry) {
                           
                           window.plugins.webintent.startActivity({
                               action: window.plugins.webintent.ACTION_VIEW,
                               url: 'file://' + entry.fullPath,
                               type: 'application/vnd.android.package-archive'
                           },
                           function(e) {
                               //location.reload(); 
                               var message = "test";
                                for(var propt in e){
                                    message = message + propt + ': ' + e[propt];
                                } 
                                alert(message);
                           },
                           function(e) {
                                var message = "test";
                                for(var propt in e){
                                    message = message + propt + ': ' + e[propt];
                                } 
                                alert(message);
                           });                              
                       }, function (error) {
                           alert("Error downloading APK: " + error.code);
                       });
                   }, function(evt) {
                       alert("Error downloading apk: " + evt.target.error.code);                                               
                   });
               }, function(evt) {
                   alert("Error preparing to download apk: " + evt.target.error.code);
               });
            }
        })
    };
    
    return me;    
    
});