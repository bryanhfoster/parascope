define([],
function () {
    
    var me = {        
        //why does this not work... serviceUrl: me.baseUrl + "services/TabletDispatcher.svc/",
        baseUrl: "",
        serviceUrl: "",
        liveBaseUrl: "https://tripmasterenterprise.com/",
        liveServiceUrl: "https://tripmasterenterprise.com/" + "services/TabletDispatcher.svc/",
        qaBaseUrl: "https://qa.tripmasterenterprise.com/",
        qaServiceUrl: "https://qa.tripmasterenterprise.com/" + "services/TabletDispatcher.svc/",
        devBaseUrl: "http://bryanhfoster.dyndns.org/",
        devServiceUrl: "http://bryanhfoster.dyndns.org/" + "services/TabletDispatcher.svc/",
        publishKey: "pub-c-08992f84-406c-490b-b7f6-0a17e9f577e8",
        subscribeKey: "sub-c-7326670e-eedc-11e2-b383-02ee2ddab7fe",
        templateDirectory: "scripts/templates/",
        currentSoftwareVersion: 1.7
    };  
        
    return me;
});